import { prisma } from "../../prisma/client.js";
import { cacheGetOrSet, cacheDel } from "../../utils/redis.js";
import { moduleMetadataKey } from "../../utils/cacheKeys.js";
import { canAccessModule, canManageModules, visibleModuleIds, type RolePermissions } from "../../utils/permissions.js";
import { PermissionDeniedError } from "../records/records.permissions.js";
import type { CreateModuleInput, UpdateModuleInput } from "./modules.validation.js";

const FIELD_TYPES = [
  "text", "number", "email", "phone", "textarea", "dropdown", "multi_select",
  "checkbox", "date", "currency", "file", "boolean",
] as const;

export interface ModulePermissionContext {
  permissions: RolePermissions | null;
}

export async function createModule(
  tenantId: string,
  input: CreateModuleInput,
  perm?: ModulePermissionContext
) {
  if (perm && !canManageModules(perm.permissions)) {
    throw new PermissionDeniedError("No permission to create modules");
  }
  const existing = await prisma.module.findFirst({
    where: { tenantId, slug: input.slug },
  });
  if (existing) throw new Error("Module with this slug already exists");
  return prisma.module.create({
    data: { tenantId, ...input },
  });
}

export async function listModules(tenantId: string, perm?: ModulePermissionContext) {
  const all = await prisma.module.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { records: true, fields: true } } },
  });
  const visible = visibleModuleIds(perm?.permissions ?? null);
  if (visible === null) return all;
  return all.filter((m) => visible.includes(m.id));
}

export async function getModuleById(
  tenantId: string,
  id: string,
  perm?: ModulePermissionContext
) {
  if (perm && !canAccessModule(perm.permissions, id, "view")) {
    throw new PermissionDeniedError("No view access to this module");
  }
  const m = await cacheGetOrSet(moduleMetadataKey(tenantId, id), async () => {
    const row = await prisma.module.findFirst({
      where: { id, tenantId },
      include: { fields: { orderBy: { orderIndex: "asc" } } },
    });
    if (!row) throw new Error("Module not found");
    return row;
  });
  return m;
}

export async function updateModule(
  tenantId: string,
  id: string,
  input: UpdateModuleInput,
  perm?: ModulePermissionContext
) {
  if (perm && !canManageModules(perm.permissions)) {
    throw new PermissionDeniedError("No permission to update modules");
  }
  await getModuleById(tenantId, id);
  if (input.slug) {
    const existing = await prisma.module.findFirst({
      where: { tenantId, slug: input.slug, id: { not: id } },
    });
    if (existing) throw new Error("Module with this slug already exists");
  }
  const updated = await prisma.module.update({
    where: { id },
    data: input,
  });
  await cacheDel(moduleMetadataKey(tenantId, id));
  return updated;
}

export async function deleteModule(tenantId: string, id: string, perm?: ModulePermissionContext) {
  if (perm && !canManageModules(perm.permissions)) {
    throw new PermissionDeniedError("No permission to delete modules");
  }
  await getModuleById(tenantId, id);
  await cacheDel(moduleMetadataKey(tenantId, id));
  return prisma.module.delete({ where: { id } });
}

export { FIELD_TYPES };
