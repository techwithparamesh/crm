import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";

export interface RequestWithTenantDomain extends Request {
  tenantIdFromDomain?: string;
}

/**
 * If the request Host header matches a tenant's customDomain,
 * set req.tenantIdFromDomain so branding and tenant resolution can use it.
 */
export async function customDomainMiddleware(
  req: RequestWithTenantDomain,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const host = req.headers.host?.split(":")[0]?.toLowerCase().trim();
  if (!host) {
    next();
    return;
  }

  try {
    const settings = await prisma.tenantSettings.findFirst({
      where: { customDomain: host },
    });
    if (settings) {
      req.tenantIdFromDomain = settings.tenantId;
    }
  } catch {
    // ignore lookup errors
  }
  next();
}
