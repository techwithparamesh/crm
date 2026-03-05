/**
 * TenantScopedRepository: ensures every query and create includes tenantId to prevent cross-tenant data access.
 *
 * Usage:
 * - For WHERE clauses: use mergeWhere(tenantId, { ...yourWhere }) so tenantId is always included.
 * - For CREATE data: use mergeCreate(tenantId, { ...yourData }) so tenantId is always attached.
 * - For UPDATE: ensure the entity was loaded with tenantId in where first (so it belongs to tenant).
 *
 * All tenant-scoped services should receive tenantId from the route (from req.tenantId) and pass it
 * to every Prisma call. Use these helpers to avoid forgetting tenantId.
 */

/** Merge tenantId into a Prisma where clause. Use for findFirst, findMany, findUnique, updateMany, deleteMany. */
export function mergeWhere<T extends Record<string, unknown>>(
  tenantId: string,
  where?: T | null
): T & { tenantId: string } {
  return { ...(where as object), tenantId } as T & { tenantId: string };
}

/** Merge tenantId into create data. Use for create, createMany. */
export function mergeCreate<T extends Record<string, unknown>>(
  tenantId: string,
  data: T
): T & { tenantId: string } {
  return { ...data, tenantId } as T & { tenantId: string };
}

/**
 * Assert that a where clause includes tenantId (for use in updates/deletes by id).
 * Use when you do prisma.x.update({ where: { id }, data }) - the preceding findFirst must use tenantId.
 */
export function assertTenantWhere(where: Record<string, unknown>, tenantId: string): void {
  if ((where as { tenantId?: string }).tenantId !== tenantId) {
    throw new Error("Cross-tenant access denied: tenantId mismatch");
  }
}
