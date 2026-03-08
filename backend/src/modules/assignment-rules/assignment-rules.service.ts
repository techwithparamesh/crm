/**
 * Lead/record assignment rules: auto-assign by conditions.
 */

import { prisma } from "../../prisma/client.js";

export interface ConditionRow {
  field: string;
  op: "eq" | "neq" | "contains" | "in";
  value: string | string[];
}

function matchConditions(conditions: ConditionRow[], values: Record<string, unknown>): boolean {
  for (const c of conditions) {
    const v = values[c.field];
    const str = v != null ? String(v).toLowerCase() : "";
    const val = Array.isArray(c.value)
      ? (c.value as string[]).map((x) => x.toLowerCase())
      : String(c.value).toLowerCase();
    if (c.op === "eq" && str !== val) return false;
    if (c.op === "neq" && str === val) return false;
    if (c.op === "contains" && !str.includes(val)) return false;
    if (c.op === "in" && !(Array.isArray(val) ? val : [val]).includes(str)) return false;
  }
  return true;
}

/**
 * Return assignToUserId for the first matching rule, or null.
 */
export async function getAssignedUserId(
  tenantId: string,
  moduleId: string,
  values: Record<string, unknown>
): Promise<string | null> {
  const rules = await prisma.assignmentRule.findMany({
    where: { tenantId, moduleId, isActive: true },
    orderBy: { orderIndex: "asc" },
  });
  for (const rule of rules) {
    let conditions: ConditionRow[];
    try {
      conditions = JSON.parse(rule.conditionsJSON) as ConditionRow[];
    } catch {
      continue;
    }
    if (matchConditions(conditions, values) && rule.assignToUserId) {
      return rule.assignToUserId;
    }
  }
  return null;
}

export async function listRules(tenantId: string, moduleId?: string) {
  return prisma.assignmentRule.findMany({
    where: { tenantId, ...(moduleId ? { moduleId } : {}) },
    orderBy: { orderIndex: "asc" },
  });
}

export async function createRule(
  tenantId: string,
  data: {
    moduleId: string;
    name: string;
    conditionsJSON: string;
    assignToUserId?: string | null;
    orderIndex?: number;
  }
) {
  return prisma.assignmentRule.create({
    data: {
      tenantId,
      moduleId: data.moduleId,
      name: data.name,
      conditionsJSON: data.conditionsJSON,
      assignToUserId: data.assignToUserId ?? null,
      orderIndex: data.orderIndex ?? 0,
    },
  });
}

export async function updateRule(
  tenantId: string,
  id: string,
  data: Partial<{ name: string; conditionsJSON: string; assignToUserId: string | null; orderIndex: number; isActive: boolean }>
) {
  await prisma.assignmentRule.findFirstOrThrow({ where: { id, tenantId } });
  return prisma.assignmentRule.update({
    where: { id },
    data,
  });
}

export async function deleteRule(tenantId: string, id: string) {
  await prisma.assignmentRule.findFirstOrThrow({ where: { id, tenantId } });
  await prisma.assignmentRule.delete({ where: { id } });
}
