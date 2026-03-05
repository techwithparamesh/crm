import { AsyncLocalStorage } from "async_hooks";

export interface TenantContext {
  tenantId: string;
}

const tenantStorage = new AsyncLocalStorage<TenantContext>();

/**
 * Run fn with tenant context. Middleware should call this so downstream code can use getTenantId().
 */
export function runWithTenant<T>(tenantId: string, fn: () => T): T {
  return tenantStorage.run({ tenantId }, fn);
}

/**
 * Get current request's tenantId. Throws if not in tenant context (e.g. middleware did not run).
 */
export function getTenantId(): string {
  const ctx = tenantStorage.getStore();
  if (!ctx?.tenantId) {
    throw new Error("Tenant context not set. Ensure tenantMiddleware runs after auth.");
  }
  return ctx.tenantId;
}

/**
 * Optional tenantId when outside request (e.g. background job). Returns null if no context.
 */
export function getTenantIdOrNull(): string | null {
  const ctx = tenantStorage.getStore();
  return ctx?.tenantId ?? null;
}
