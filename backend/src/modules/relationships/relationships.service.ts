import { prisma } from "../../prisma/client.js";
import type { CreateRelationshipInput, UpdateRelationshipInput } from "./relationships.validation.js";

export async function createRelationship(tenantId: string, input: CreateRelationshipInput) {
  const [source, target] = await Promise.all([
    prisma.module.findFirst({ where: { id: input.sourceModuleId, tenantId } }),
    prisma.module.findFirst({ where: { id: input.targetModuleId, tenantId } }),
  ]);
  if (!source) throw new Error("Source module not found");
  if (!target) throw new Error("Target module not found");
  if (input.sourceModuleId === input.targetModuleId) throw new Error("Source and target module must differ");

  const existing = await prisma.moduleRelationship.findFirst({
    where: { tenantId, name: input.name },
  });
  if (existing) throw new Error("A relationship with this name already exists");

  return prisma.moduleRelationship.create({
    data: {
      tenantId,
      name: input.name,
      sourceModuleId: input.sourceModuleId,
      targetModuleId: input.targetModuleId,
      relationshipType: input.relationshipType,
    },
    include: { sourceModule: true, targetModule: true },
  });
}

export async function listRelationships(tenantId: string, moduleId?: string) {
  const where = moduleId
    ? { tenantId, OR: [{ sourceModuleId: moduleId }, { targetModuleId: moduleId }] }
    : { tenantId };
  return prisma.moduleRelationship.findMany({
    where,
    orderBy: { name: "asc" },
    include: { sourceModule: true, targetModule: true },
  });
}

export async function getRelationshipById(tenantId: string, id: string) {
  const r = await prisma.moduleRelationship.findFirst({
    where: { id, tenantId },
    include: { sourceModule: true, targetModule: true },
  });
  if (!r) throw new Error("Relationship not found");
  return r;
}

export async function updateRelationship(tenantId: string, id: string, input: UpdateRelationshipInput) {
  await getRelationshipById(tenantId, id);
  return prisma.moduleRelationship.update({
    where: { id },
    data: input,
    include: { sourceModule: true, targetModule: true },
  });
}

export async function deleteRelationship(tenantId: string, id: string) {
  await getRelationshipById(tenantId, id);
  return prisma.moduleRelationship.delete({ where: { id } });
}
