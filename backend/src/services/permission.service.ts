/**
 * Permission service — per-module CRUD for roles.
 * Uses RolePermission table when present; falls back to Role.permissionsJSON.
 * Part of the Business OS platform (permissionService).
 */

import { prisma } from "../prisma/client.js";
import { parsePermissions, canAccessModule, type PermissionAction } from "../utils/permissions.js";

export type CrudAction = "create" | "read" | "update" | "delete";

const ACTION_MAP: Record<CrudAction, PermissionAction> = {
  create: "create",
  read: "view",
  update: "edit",
  delete: "delete",
};

export interface ModuleCrud {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

/**
 * Get CRUD permissions for a role on a module.
 * If RolePermission row exists, use it; otherwise derive from permissionsJSON.
 */
export async function getModuleCrud(
  roleId: string | null,
  moduleId: string
): Promise<ModuleCrud> {
  if (!roleId) {
    return { canCreate: true, canRead: true, canUpdate: true, canDelete: true };
  }

  const row = await prisma.rolePermission.findUnique({
    where: { roleId_moduleId: { roleId, moduleId } },
  });

  if (row) {
    return {
      canCreate: row.canCreate,
      canRead: row.canRead,
      canUpdate: row.canUpdate,
      canDelete: row.canDelete,
    };
  }

  const role = await prisma.role.findUnique({
    where: { id: roleId },
    select: { permissionsJSON: true },
  });
  const permissions = parsePermissions(role?.permissionsJSON ?? null);
  const action = (a: CrudAction) => canAccessModule(permissions, moduleId, ACTION_MAP[a]);

  return {
    canCreate: action("create"),
    canRead: action("read"),
    canUpdate: action("update"),
    canDelete: action("delete"),
  };
}

/**
 * Check if role can perform action on module.
 */
export async function can(
  roleId: string | null,
  moduleId: string,
  action: CrudAction
): Promise<boolean> {
  const crud = await getModuleCrud(roleId, moduleId);
  switch (action) {
    case "create":
      return crud.canCreate;
    case "read":
      return crud.canRead;
    case "update":
      return crud.canUpdate;
    case "delete":
      return crud.canDelete;
    default:
      return false;
  }
}

/**
 * Set or update RolePermission for a role and module (explicit CRUD).
 */
export async function setModuleCrud(
  roleId: string,
  moduleId: string,
  crud: Partial<ModuleCrud>
): Promise<void> {
  await prisma.rolePermission.upsert({
    where: { roleId_moduleId: { roleId, moduleId } },
    create: {
      roleId,
      moduleId,
      canCreate: crud.canCreate ?? true,
      canRead: crud.canRead ?? true,
      canUpdate: crud.canUpdate ?? true,
      canDelete: crud.canDelete ?? true,
    },
    update: {
      ...(crud.canCreate !== undefined && { canCreate: crud.canCreate }),
      ...(crud.canRead !== undefined && { canRead: crud.canRead }),
      ...(crud.canUpdate !== undefined && { canUpdate: crud.canUpdate }),
      ...(crud.canDelete !== undefined && { canDelete: crud.canDelete }),
    },
  });
}
