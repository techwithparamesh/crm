/**
 * Role-based permissions stored in Role.permissionsJSON.
 * Controls module access, record visibility, edit/delete permissions.
 */

export type ModulePermission = {
  view?: boolean;
  create?: boolean;
  edit?: boolean;
  delete?: boolean;
};

export type RolePermissions = {
  /** Per-module: moduleId -> { view, create, edit, delete }. If missing, no access. */
  modules?: Record<string, ModulePermission>;
  /** "all" = see all records; "own" = only records created by user. Default "all". */
  recordVisibility?: "all" | "own";
  /** If true, can create/update/delete modules and manage fields. */
  manageModules?: boolean;
};

export type PermissionAction = "view" | "create" | "edit" | "delete";

/** Parse permissions from role. Returns null for full access (no role or empty). */
export function parsePermissions(permissionsJSON: string | null | undefined): RolePermissions | null {
  if (!permissionsJSON?.trim()) return null;
  try {
    const o = JSON.parse(permissionsJSON) as Record<string, unknown>;
    const modules =
      o.modules && typeof o.modules === "object" && o.modules !== null
        ? (o.modules as Record<string, ModulePermission>)
        : undefined;
    const recordVisibility =
      o.recordVisibility === "own" || o.recordVisibility === "all"
        ? o.recordVisibility
        : undefined;
    const manageModules = o.manageModules === true;
    if (!modules && !recordVisibility && !manageModules) return null;
    return { modules, recordVisibility, manageModules };
  } catch {
    return null;
  }
}

/** Full access when permissions is null. */
export function canAccessModule(
  permissions: RolePermissions | null,
  moduleId: string,
  action: PermissionAction
): boolean {
  if (!permissions) return true;
  if (!permissions.modules || !permissions.modules[moduleId]) return false;
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

/** Can user view this record? (module view + recordVisibility) */
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

/** Can user edit this record? */
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

/** Can user delete this record? */
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

/** List module IDs the user can at least view. If permissions null, returns null (all). */
export function visibleModuleIds(permissions: RolePermissions | null): string[] | null {
  if (!permissions?.modules) return null;
  return Object.entries(permissions.modules)
    .filter(([, p]) => p.view === true)
    .map(([id]) => id);
}
