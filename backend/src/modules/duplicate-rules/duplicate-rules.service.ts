/**
 * Duplicate detection: warn before creating duplicate records by field (email, phone, etc.).
 */

import { prisma } from "../../prisma/client.js";

/**
 * Check for existing record with same value in the given field.
 * Returns matching record ids if any.
 */
export async function findDuplicates(
  tenantId: string,
  moduleId: string,
  fieldKey: string,
  value: string
): Promise<string[]> {
  if (!value || String(value).trim() === "") return [];

  const field = await prisma.field.findFirst({
    where: { moduleId, tenantId, fieldKey },
  });
  if (!field) return [];

  const rules = await prisma.duplicateRule.findMany({
    where: { tenantId, moduleId, isActive: true },
  });
  const ruleFields = rules.map((r) => r.fieldKey);
  if (!ruleFields.includes(fieldKey)) return [];

  // Find records that have this field value
  const records = await prisma.record.findMany({
    where: {
      tenantId,
      moduleId,
      values: {
        some: {
          fieldId: field.id,
          valueText: { equals: String(value).trim() },
        },
      },
    },
    select: { id: true },
  });
  return records.map((r) => r.id);
}

/**
 * Check all duplicate rules for a module and return { fieldKey: recordIds[] }.
 */
export async function checkDuplicateFields(
  tenantId: string,
  moduleId: string,
  values: Record<string, unknown>
): Promise<Record<string, string[]>> {
  const rules = await prisma.duplicateRule.findMany({
    where: { tenantId, moduleId, isActive: true },
  });
  const result: Record<string, string[]> = {};
  for (const rule of rules) {
    const v = values[rule.fieldKey];
    if (v == null || String(v).trim() === "") continue;
    const ids = await findDuplicates(tenantId, moduleId, rule.fieldKey, String(v));
    if (ids.length) result[rule.fieldKey] = ids;
  }
  return result;
}

export async function listRules(tenantId: string, moduleId?: string) {
  return prisma.duplicateRule.findMany({
    where: { tenantId, ...(moduleId ? { moduleId } : {}) },
  });
}

export async function createRule(
  tenantId: string,
  data: { moduleId: string; fieldKey: string }
) {
  return prisma.duplicateRule.create({
    data: {
      tenantId,
      moduleId: data.moduleId,
      fieldKey: data.fieldKey,
    },
  });
}

export async function deleteRule(tenantId: string, id: string) {
  await prisma.duplicateRule.findFirstOrThrow({ where: { id, tenantId } });
  await prisma.duplicateRule.delete({ where: { id } });
}
