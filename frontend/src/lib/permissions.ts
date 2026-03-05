/**
 * Role permissions (matches backend RolePermissions).
 * Used to hide/disable UI based on permissions.
 */

export type ModulePermission = {
  view?: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
};

export type RolePermissions = {
  modules?: Record<string, ModulePermission>;
  recordVisibility?: "all" | "own";
  manageModules?: boolean;
};

export type PermissionAction = "view" | "create" | "edit" | "delete";

export function canAccessModule(
  permissions: RolePermissions | null,
  moduleId: string,
  action: PermissionAction
): boolean {
  if (!permissions) return true;
  if (!permissions.modules?.[moduleId]) return false;
  const mod = permissions.modules[moduleId];
  switch (action) {
    case "view":
      return mod.view === true;
    case "create":
      return mod.create === true;
    case "edit":
      return mod.edit === true;
    case "delete":
      return mod.delete === true;
    default:
      return false;
  }
}

export function canViewRecord(
  permissions: RolePermissions | null,
  moduleId: string,
  recordCreatedBy: string | null,
  userId: string
): boolean {
  if (!canAccessModule(permissions, moduleId, "view")) return false;
  if (!permissions?.recordVisibility || permissions.recordVisibility === "all") return true;
  return recordCreatedBy === userId;
}

export function canEditRecord(
  permissions: RolePermissions | null,
  moduleId: string,
  recordCreatedBy: string | null,
  userId: string
): boolean {
  if (!canAccessModule(permissions, moduleId, "edit")) return false;
  if (!permissions?.recordVisibility || permissions.recordVisibility === "all") return true;
  return recordCreatedBy === userId;
}

export function canDeleteRecord(
  permissions: RolePermissions | null,
  moduleId: string,
  recordCreatedBy: string | null,
  userId: string
): boolean {
  if (!canAccessModule(permissions, moduleId, "delete")) return false;
  if (!permissions?.recordVisibility || permissions.recordVisibility === "all") return true;
  return recordCreatedBy === userId;
}

export function canManageModules(permissions: RolePermissions | null): boolean {
  if (!permissions) return true;
  return permissions.manageModules === true;
}
