import { Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware.js";
import { runWithTenant } from "../utils/tenantContext.js";

export interface TenantRequest extends AuthRequest {
  /** Set by TenantMiddleware from JWT (req.user.tenantId). Single source of truth for tenant scope. */
  tenantId?: string;
}

/**
 * Strict multi-tenant isolation:
 * - Extracts tenantId from JWT (req.user.tenantId) and sets req.tenantId.
 * - Runs the request in async tenant context so getTenantId() works downstream.
 * - Must run after authMiddleware (or authOrApiTokenMiddleware).
 */
export function tenantMiddleware(req: TenantRequest, res: Response, next: NextFunction): void {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(403).json({ error: "Tenant context required" });
    return;
  }
  req.tenantId = tenantId;
  runWithTenant(tenantId, () => next());
}
