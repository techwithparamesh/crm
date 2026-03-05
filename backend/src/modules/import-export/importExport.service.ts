import { prisma } from "../../prisma/client.js";
import { mergeWhere } from "../../utils/tenantScopedRepository.js";
import { areQueuesAvailable, csvImportQueue } from "../../queues/queues.js";
import { normalizeValue, buildRecordValuePayload } from "../records/record-values.js";
import { parseCsv } from "./csvParser.js";
import { rowToValues, type FieldMeta } from "./importValidation.js";

const SYNC_IMPORT_LIMIT = 200;

export async function parseCsvFile(buffer: Buffer) {
  return parseCsv(buffer);
}

export async function getModuleFieldsForImport(tenantId: string, moduleId: string) {
  const module = await prisma.module.findFirst({
    where: { id: moduleId, tenantId },
    include: { fields: { orderBy: { orderIndex: "asc" } } },
  });
  if (!module) throw new Error("Module not found");
  return {
    module: { id: module.id, name: module.name, slug: module.slug },
    fields: module.fields.map((f) => ({
      id: f.id,
      fieldKey: f.fieldKey,
      label: f.label,
      fieldType: f.fieldType,
      isRequired: f.isRequired,
    })),
  };
}

export async function runImport(
  tenantId: string,
  moduleId: string,
  mapping: Record<string, string>,
  rows: Record<string, string>[],
  createdBy: string | null,
  options: { useJobQueue?: boolean } = {}
): Promise<{ jobId?: string; successCount?: number; errorCount?: number; errors?: string[] }> {
  const useQueue = options.useJobQueue ?? rows.length > SYNC_IMPORT_LIMIT;
  const module = await prisma.module.findFirst({
    where: { id: moduleId, tenantId },
    include: { fields: { orderBy: { orderIndex: "asc" } } },
  });
  if (!module) throw new Error("Module not found");

  const fields: FieldMeta[] = module.fields.map((f) => ({
    id: f.id,
    fieldKey: f.fieldKey,
    fieldType: f.fieldType,
    isRequired: f.isRequired,
    defaultValue: f.defaultValue,
  }));

  if (!useQueue) {
    return runImportSync(tenantId, moduleId, module.fields, mapping, rows, createdBy, fields);
  }

  const job = await prisma.importJob.create({
    data: {
      tenantId,
      moduleId,
      status: "processing",
      mappingJSON: JSON.stringify(mapping),
      totalRows: rows.length,
      createdBy,
    },
  });

  if (areQueuesAvailable() && csvImportQueue) {
    await (csvImportQueue as unknown as { add: (data: unknown) => Promise<unknown> }).add({
      jobId: job.id,
      tenantId,
      moduleId,
      mapping,
      rows,
      createdBy,
    });
  } else {
    setImmediate(() => {
      processImportJob(job.id, tenantId, moduleId, mapping, rows, createdBy, module.fields, fields).catch((e) => {
        console.error("[import] Job failed:", e);
      });
    });
  }

  return { jobId: job.id };
}

async function runImportSync(
  tenantId: string,
  moduleId: string,
  moduleFields: { id: string; fieldKey: string; fieldType: string; defaultValue: string | null }[],
  mapping: Record<string, string>,
  rows: Record<string, string>[],
  createdBy: string | null,
  fields: FieldMeta[]
): Promise<{ successCount: number; errorCount: number; errors: string[] }> {
  let successCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const { values, errors: rowErrors } = rowToValues(rows[i], mapping, fields, i + 2);
    if (rowErrors.length > 0) {
      errors.push(`Row ${i + 2}: ${rowErrors.map((e) => `${e.field} ${e.message}`).join("; ")}`);
      continue;
    }
    try {
      await createRecordFromValues(tenantId, moduleId, moduleFields, values, createdBy);
      successCount++;
    } catch (e) {
      errors.push(`Row ${i + 2}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { successCount, errorCount: rows.length - successCount, errors };
}

async function createRecordFromValues(
  tenantId: string,
  moduleId: string,
  moduleFields: { id: string; fieldKey: string; fieldType: string; defaultValue: string | null }[],
  values: Record<string, unknown>,
  createdBy: string | null
) {
  const rec = await prisma.record.create({
    data: { moduleId, tenantId, createdBy },
  });

  for (const field of moduleFields) {
    const raw = values[field.fieldKey];
    const def = field.defaultValue ?? null;
    const value = raw !== undefined && raw !== null && raw !== "" ? raw : (def !== null ? def : null);
    if (value === null) continue;
    const normalized = normalizeValue(field.fieldType, value);
    const payload = buildRecordValuePayload(field.fieldType, normalized);
    await prisma.recordValue.create({
      data: { recordId: rec.id, fieldId: field.id, ...payload },
    });
  }
}

async function processImportJob(
  jobId: string,
  tenantId: string,
  moduleId: string,
  mapping: Record<string, string>,
  rows: Record<string, string>[],
  createdBy: string | null,
  moduleFields: { id: string; fieldKey: string; fieldType: string; defaultValue: string | null }[],
  fields: FieldMeta[]
) {
  let processedRows = 0;
  let successCount = 0;
  let errorCount = 0;
  let lastError: string | null = null;

  try {
    for (let i = 0; i < rows.length; i++) {
      const { values, errors: rowErrors } = rowToValues(rows[i], mapping, fields, i + 2);
      processedRows++;
      if (rowErrors.length > 0) {
        errorCount++;
        lastError = `Row ${i + 2}: ${rowErrors.map((e) => `${e.field} ${e.message}`).join("; ")}`;
        await prisma.importJob.update({
          where: { id: jobId },
          data: { processedRows, successCount, errorCount, errorMessage: lastError },
        });
        continue;
      }
      try {
        await createRecordFromValues(tenantId, moduleId, moduleFields, values, createdBy);
        successCount++;
      } catch (e) {
        errorCount++;
        lastError = `Row ${i + 2}: ${e instanceof Error ? e.message : String(e)}`;
      }
      if (processedRows % 50 === 0) {
        await prisma.importJob.update({
          where: { id: jobId },
          data: { processedRows, successCount, errorCount, errorMessage: lastError },
        });
      }
    }
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        processedRows,
        successCount,
        errorCount,
        errorMessage: lastError,
        completedAt: new Date(),
      },
    });
  } catch (e) {
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        processedRows,
        successCount,
        errorCount,
        errorMessage: e instanceof Error ? e.message : String(e),
        completedAt: new Date(),
      },
    });
  }
}

/** Called by background worker to process a queued import job. */
export async function runImportJobFromQueue(
  jobId: string,
  tenantId: string,
  moduleId: string,
  mapping: Record<string, string>,
  rows: Record<string, string>[],
  createdBy: string | null
): Promise<void> {
  const module = await prisma.module.findFirst({
    where: { id: moduleId, tenantId },
    include: { fields: { orderBy: { orderIndex: "asc" } } },
  });
  if (!module) throw new Error("Module not found");
  const fields: FieldMeta[] = module.fields.map((f) => ({
    id: f.id,
    fieldKey: f.fieldKey,
    fieldType: f.fieldType,
    isRequired: f.isRequired,
    defaultValue: f.defaultValue,
  }));
  await processImportJob(jobId, tenantId, moduleId, mapping, rows, createdBy, module.fields, fields);
}

export async function getImportJob(tenantId: string, jobId: string) {
  const job = await prisma.importJob.findFirst({
    where: mergeWhere(tenantId, { id: jobId }),
  });
  if (!job) throw new Error("Import job not found");
  return job;
}

export async function listImportJobs(tenantId: string, limit = 20) {
  return prisma.importJob.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// ---------- Export ----------

export async function exportModuleRecords(
  tenantId: string,
  moduleId: string,
  format: "csv" | "excel",
  fieldKeys: string[]
) {
  const module = await prisma.module.findFirst({
    where: { id: moduleId, tenantId },
    include: { fields: { orderBy: { orderIndex: "asc" } } },
  });
  if (!module) throw new Error("Module not found");

  const keys = fieldKeys.length > 0 ? fieldKeys : module.fields.map((f) => f.fieldKey);
  const fieldMap = new Map(module.fields.filter((f) => keys.includes(f.fieldKey)).map((f) => [f.fieldKey, f]));

  const records = await prisma.record.findMany({
    where: { moduleId, tenantId },
    include: { values: { where: { fieldId: { in: [...fieldMap.values()].map((f) => f.id) } }, include: { field: true } } },
    orderBy: { updatedAt: "desc" },
  });

  const orderedFields = keys.map((k) => fieldMap.get(k)).filter(Boolean) as { id: string; fieldKey: string; fieldType: string }[];
  const rows: Record<string, unknown>[] = records.map((r) => {
    const row: Record<string, unknown> = {};
    for (const f of orderedFields) {
      const v = r.values.find((val) => val.fieldId === f.id);
      if (!v) {
        row[f.fieldKey] = "";
        continue;
      }
      if (v.valueText != null) row[f.fieldKey] = v.valueText;
      else if (v.valueNumber != null) row[f.fieldKey] = v.valueNumber;
      else if (v.valueDate != null) row[f.fieldKey] = v.valueDate.toISOString().slice(0, 10);
      else if (v.valueJSON != null) {
        try {
          const parsed = JSON.parse(v.valueJSON);
          row[f.fieldKey] = Array.isArray(parsed) ? parsed.join(", ") : parsed;
        } catch {
          row[f.fieldKey] = v.valueJSON;
        }
      } else row[f.fieldKey] = "";
    }
    return row;
  });

  if (format === "csv") {
    return buildCsvBuffer(orderedFields.map((f) => f.fieldKey), rows);
  }
  return await buildExcelBuffer(orderedFields.map((f) => f.fieldKey), rows);
}

function buildCsvBuffer(headers: string[], rows: Record<string, unknown>[]): Buffer {
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return Buffer.from(lines.join("\n"), "utf-8");
}

async function buildExcelBuffer(headers: string[], rows: Record<string, unknown>[]): Promise<Buffer> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const data = [headers, ...rows.map((r) => headers.map((h) => r[h] ?? ""))];
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Records");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}
