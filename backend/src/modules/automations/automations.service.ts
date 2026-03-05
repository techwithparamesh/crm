import { prisma } from "../../prisma/client.js";
import type { CreateAutomationInput, UpdateAutomationInput } from "./automations.validation.js";

export async function createAutomation(tenantId: string, input: CreateAutomationInput) {
  if (input.moduleId) {
    const module = await prisma.module.findFirst({
      where: { id: input.moduleId, tenantId },
    });
    if (!module) throw new Error("Module not found");
  }
  return prisma.automation.create({
    data: {
      tenantId,
      moduleId: input.moduleId,
      name: input.name,
      triggerType: input.triggerType,
      conditionsJSON: input.conditionsJSON ?? null,
      actionsJSON: input.actionsJSON,
      isActive: input.isActive ?? true,
    },
  });
}

export async function listAutomations(tenantId: string, moduleId?: string) {
  const where: { tenantId: string; moduleId?: string } = { tenantId };
  if (moduleId) where.moduleId = moduleId;
  return prisma.automation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { module: true },
  });
}

export async function getAutomationById(tenantId: string, id: string) {
  const a = await prisma.automation.findFirst({
    where: { id, tenantId },
    include: { module: true },
  });
  if (!a) throw new Error("Automation not found");
  return a;
}

export async function updateAutomation(tenantId: string, id: string, input: UpdateAutomationInput) {
  await getAutomationById(tenantId, id);
  return prisma.automation.update({
    where: { id },
    data: {
      ...(input.moduleId !== undefined && { moduleId: input.moduleId }),
      ...(input.name !== undefined && { name: input.name }),
      ...(input.triggerType !== undefined && { triggerType: input.triggerType }),
      ...(input.conditionsJSON !== undefined && { conditionsJSON: input.conditionsJSON }),
      ...(input.actionsJSON !== undefined && { actionsJSON: input.actionsJSON }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
    },
  });
}

export async function deleteAutomation(tenantId: string, id: string) {
  await getAutomationById(tenantId, id);
  return prisma.automation.delete({ where: { id } });
}
