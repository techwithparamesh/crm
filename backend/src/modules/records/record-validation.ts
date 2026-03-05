/**
 * Validate record values against module field metadata (required, unique).
 */

import { prisma } from "../../prisma/client.js";

interface FieldMeta {
  id: string;
  fieldKey: string;
  fieldType: string;
  isRequired: boolean;
  isUnique: boolean;
}

export async function validateValuesForCreate(
  tenantId: string,
  moduleId: string,
  values: Record<string, unknown>
): Promise<void> {
  const fields = await prisma.field.findMany({
    where: { moduleId, tenantId },
    orderBy: { orderIndex: "asc" },
  });
  validateRequired(fields, values);
  await validateUniques(tenantId, moduleId, fields, values, null);
}

export async function validateValuesForUpdate(
  tenantId: string,
  moduleId: string,
  recordId: string,
  values: Record<string, unknown>
): Promise<void> {
  const fields = await prisma.field.findMany({
    where: { moduleId, tenantId },
    orderBy: { orderIndex: "asc" },
  });
  // On update we only validate required for keys that are being sent (partial update)
  validateRequiredPartial(fields, values);
  await validateUniques(tenantId, moduleId, fields, values, recordId);
}

function validateRequired(fields: FieldMeta[], values: Record<string, unknown>): void {
  for (const field of fields) {
    if (!field.isRequired) continue;
    const v = values[field.fieldKey];
    if (v === undefined || v === null || v === "") {
      throw new Error(`Field "${field.fieldKey}" is required`);
    }
  }
}

function validateRequiredPartial(fields: FieldMeta[], values: Record<string, unknown>): void {
  for (const field of fields) {
    if (!field.isRequired) continue;
    if (!(field.fieldKey in values)) continue; // not in payload, skip
    const v = values[field.fieldKey];
    if (v === undefined || v === null || v === "") {
      throw new Error(`Field "${field.fieldKey}" is required`);
    }
  }
}

async function validateUniques(
  tenantId: string,
  moduleId: string,
  fields: FieldMeta[],
  values: Record<string, unknown>,
  excludeRecordId: string | null
): Promise<void> {
  for (const field of fields) {
    if (!field.isUnique) continue;
    const v = values[field.fieldKey];
    if (v === undefined || v === null || v === "") continue;

    const col = getValueColumnForQuery(field.fieldType);
    const recordWhere: { tenantId: string; moduleId: string; id?: { not: string } } = {
      tenantId,
      moduleId,
    };
    if (excludeRecordId) recordWhere.id = { not: excludeRecordId };

    if (col === "valueText") {
      const existing = await prisma.recordValue.findFirst({
        where: { fieldId: field.id, valueText: String(v), record: recordWhere },
        select: { recordId: true },
      });
      if (existing) throw new Error(`Field "${field.fieldKey}" must be unique; value already exists`);
    } else if (col === "valueNumber") {
      const existing = await prisma.recordValue.findFirst({
        where: { fieldId: field.id, valueNumber: Number(v), record: recordWhere },
        select: { recordId: true },
      });
      if (existing) throw new Error(`Field "${field.fieldKey}" must be unique; value already exists`);
    } else if (col === "valueDate") {
      const d = v instanceof Date ? v : new Date(String(v));
      const existing = await prisma.recordValue.findFirst({
        where: { fieldId: field.id, valueDate: d, record: recordWhere },
        select: { recordId: true },
      });
      if (existing) throw new Error(`Field "${field.fieldKey}" must be unique; value already exists`);
    } else {
      const jsonVal = typeof v === "string" ? v : JSON.stringify(v);
      const existing = await prisma.recordValue.findFirst({
        where: { fieldId: field.id, valueJSON: jsonVal, record: recordWhere },
        select: { recordId: true },
      });
      if (existing) throw new Error(`Field "${field.fieldKey}" must be unique; value already exists`);
    }
  }
}

function getValueColumnForQuery(fieldType: string): "valueText" | "valueNumber" | "valueDate" | "valueJSON" {
  switch (fieldType) {
    case "number":
    case "currency":
      return "valueNumber";
    case "date":
      return "valueDate";
    case "dropdown":
    case "multi_select":
    case "checkbox":
    case "boolean":
      return "valueJSON";
    default:
      return "valueText";
  }
}
