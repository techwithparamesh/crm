import { prisma } from "../../prisma/client.js";
import { createAuditLog } from "../audit-log/audit-log.service.js";
import type { CreateRoleInput, UpdateRoleInput } from "./roles.validation.js";

export async function createRole(tenantId: string, input: CreateRoleInput) {
  const existing = await prisma.role.findFirst({
    where: { tenantId, name: input.name },
  });
  if (existing) throw new Error("Role with this name already exists");
  return prisma.role.create({
    data: {
      tenantId,
      name: input.name,
      permissionsJSON: input.permissionsJSON ?? null,
    },
  });
}

export async function listRoles(tenantId: string) {
  return prisma.role.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: { _count: { select: { users: true } } },
  });
}

export async function getRoleById(tenantId: string, id: string) {
  const r = await prisma.role.findFirst({
    where: { id, tenantId },
  });
  if (!r) throw new Error("Role not found");
  return r;
}

export async function updateRole(tenantId: string, id: string, input: UpdateRoleInput, userId?: string | null) {
  const existingRole = await getRoleById(tenantId, id);
  if (input.name) {
    const existing = await prisma.role.findFirst({
      where: { tenantId, name: input.name, id: { not: id } },
    });
    if (existing) throw new Error("Role with this name already exists");
  }
  const updated = await prisma.role.update({
    where: { id },
    data: {
      ...(input.name != null && { name: input.name }),
      ...(input.permissionsJSON !== undefined && { permissionsJSON: input.permissionsJSON }),
    },
  });
  if (input.permissionsJSON !== undefined) {
    createAuditLog({
      tenantId,
      userId: userId ?? null,
      action: "permission_changed",
      entityType: "role",
      entityId: id,
      metadataJSON: JSON.stringify({ roleName: updated.name }),
    }).catch(() => {});
  }
  return updated;
}

export async function deleteRole(tenantId: string, id: string) {
  await getRoleById(tenantId, id);
  return prisma.role.delete({ where: { id } });
}
