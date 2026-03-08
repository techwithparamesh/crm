import { prisma } from "../../prisma/client.js";
import type { RecordListItem } from "../records/records.types.js";

/** Field types whose values are included in search (text, textarea, email, phone, dropdown) */
const SEARCHABLE_FIELD_TYPES = ["text", "textarea", "email", "phone", "dropdown"];

/** Escape LIKE special characters (%, _) for MySQL */
function escapeLike(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

export interface GlobalSearchResult {
  [moduleSlug: string]: RecordListItem[];
}

/**
 * Global search: uses SearchIndex table when possible (faster), falls back to EAV LIKE search.
 * Returns results grouped by module slug.
 */
export async function globalSearch(
  tenantId: string,
  query: string,
  limitPerModule = 10
): Promise<GlobalSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) return {};

  const likePattern = `%${escapeLike(trimmed)}%`;

  // Prefer SearchIndex when we have indexed rows (faster)
  const indexRows = await prisma.searchIndex.findMany({
    where: {
      tenantId,
      OR: [
        { title: { contains: trimmed } },
        { content: { contains: trimmed } },
      ],
    },
    select: { recordId: true, moduleId: true },
    take: 500,
  });

  let rows: { recordId: string; moduleId: string }[];
  if (indexRows.length > 0) {
    rows = indexRows.map((r) => ({ recordId: r.recordId, moduleId: r.moduleId }));
  } else {
    const placeholders = SEARCHABLE_FIELD_TYPES.map(() => "?").join(",");
    type Row = { recordId: string; moduleId: string };
    rows = await prisma.$queryRawUnsafe<Row[]>(
      `SELECT DISTINCT r.id AS recordId, r.moduleId
       FROM \`Record\` r
       INNER JOIN \`RecordValue\` rv ON rv.recordId = r.id
       INNER JOIN \`Field\` f ON f.id = rv.fieldId
         AND f.fieldType IN (${placeholders})
       WHERE r.tenantId = ?
         AND (
           (rv.value_text IS NOT NULL AND rv.value_text != '' AND rv.value_text LIKE ?)
           OR (rv.value_json IS NOT NULL AND rv.value_json != '' AND rv.value_json LIKE ?)
         )
       LIMIT 500`,
      ...SEARCHABLE_FIELD_TYPES,
      tenantId,
      likePattern,
      likePattern
    );
  }

  if (rows.length === 0) return {};

  const recordIds = [...new Set(rows.map((r) => r.recordId))];
  const byModuleId = new Map<string, string[]>();
  for (const r of rows) {
    if (!byModuleId.has(r.moduleId)) byModuleId.set(r.moduleId, []);
    const arr = byModuleId.get(r.moduleId)!;
    if (!arr.includes(r.recordId)) arr.push(r.recordId);
  }

  const records = await prisma.record.findMany({
    where: { id: { in: recordIds }, tenantId }, 
    include: {
      module: true,
      stage: true,
      values: { include: { field: true } },
    },
  });

  const recordMap = new Map(records.map((r) => [r.id, r]));
  const grouped: Record<string, RecordListItem[]> = {};

  for (const [moduleId, ids] of byModuleId.entries()) {
    const slug = records.find((r) => r.moduleId === moduleId)?.module?.slug ?? moduleId;
    if (!grouped[slug]) grouped[slug] = [];
    const items = ids
      .slice(0, limitPerModule)
      .map((id) => recordMap.get(id))
      .filter(Boolean) as typeof records;
    for (const rec of items) {
      grouped[slug].push(mapToListItem(rec));
    }
  }

  return grouped;
}

function mapToListItem(record: {
  id: string;
  moduleId: string;
  tenantId: string;
  createdBy: string | null;
  pipelineStageId: string | null;
  createdAt: Date;
  updatedAt: Date;
  values: Array<{
    field: { fieldKey: string; fieldType: string };
    valueText: string | null;
    valueNumber: number | null;
    valueDate: Date | null;
    valueJSON: string | null;
  }>;
  stage: { id: string; stageName: string; orderIndex: number } | null;
}): RecordListItem {
  const values: Record<string, unknown> = {};
  for (const v of record.values) {
    if (v.valueText != null) values[v.field.fieldKey] = v.valueText;
    else if (v.valueNumber != null) values[v.field.fieldKey] = v.valueNumber;
    else if (v.valueDate != null) values[v.field.fieldKey] = v.valueDate.toISOString();
    else if (v.valueJSON != null) {
      try {
        values[v.field.fieldKey] = JSON.parse(v.valueJSON);
      } catch {
        values[v.field.fieldKey] = v.valueJSON;
      }
    }
  }
  return {
    id: record.id,
    moduleId: record.moduleId,
    tenantId: record.tenantId,
    createdBy: record.createdBy,
    pipelineStageId: record.pipelineStageId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    values,
    stage: record.stage ?? undefined,
  };
}
