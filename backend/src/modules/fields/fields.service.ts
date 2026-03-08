import { prisma } from "../../prisma/client.js";
import { cacheDel } from "../../utils/redis.js";
import { moduleMetadataKey } from "../../utils/cacheKeys.js";
import type { CreateFieldInput, UpdateFieldInput } from "./fields.validation.js";

export async function createField(tenantId: string, moduleId: string, input: CreateFieldInput) {
  const module = await prisma.module.findFirst({ where: { id: moduleId, tenantId } });
  if (!module) throw new Error("Module not found");
  const existing = await prisma.field.findFirst({
    where: { moduleId, fieldKey: input.fieldKey },
  });
  if (existing) throw new Error("Field key already exists in this module");
  const field = await prisma.field.create({
    data: { moduleId, tenantId, ...input },
  });
  await cacheDel(moduleMetadataKey(tenantId, moduleId));
  return field;
}

export async function listFieldsByModule(tenantId: string, moduleId: string) {
  const module = await prisma.module.findFirst({ where: { id: moduleId, tenantId } });
  if (!module) throw new Error("Module not found");
  return prisma.field.findMany({
    where: { moduleId },
    orderBy: { orderIndex: "asc" },
  });
}

export async function getFieldById(tenantId: string, fieldId: string) {
  const f = await prisma.field.findFirst({
    where: { id: fieldId, tenantId },
  });
  if (!f) throw new Error("Field not found");
  return f;
}

export async function updateField(tenantId: string, fieldId: string, input: UpdateFieldInput) {
  const f = await getFieldById(tenantId, fieldId);
  const updated = await prisma.field.update({
    where: { id: fieldId },
    data: input,
  });
  await cacheDel(moduleMetadataKey(tenantId, f.moduleId));
  return updated;
}

export async function deleteField(tenantId: string, fieldId: string) {
  const f = await getFieldById(tenantId, fieldId);
  await prisma.field.delete({ where: { id: fieldId } });
  await cacheDel(moduleMetadataKey(tenantId, f.moduleId));
}
