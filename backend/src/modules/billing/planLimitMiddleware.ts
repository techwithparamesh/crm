/**
 * checkPlanLimit(tenantId, limitType): ensures tenant has not exceeded plan limit.
 * Use before creating users, modules, automations, etc.
 */

import { Response, NextFunction } from "express";
import { prisma } from "../../prisma/client.js";
import { getActiveUserCount } from "./billing.service.js";
import type { TenantRequest } from "../../middleware/tenantMiddleware.js";

export type PlanLimitType = "maxUsers" | "maxModules" | "maxRecords" | "maxAutomations" | "maxApiCalls" | "maxStorageGB";

async function getCurrentCount(tenantId: string, limitType: PlanLimitType): Promise<number> {
  switch (limitType) {
    case "maxUsers":
      return getActiveUserCount(tenantId);
    case "maxModules":
      return prisma.module.count({ where: { tenantId } });
    case "maxRecords":
      return prisma.record.count({ where: { tenantId } });
    case "maxAutomations":
      return prisma.automation.count({ where: { tenantId } });
    case "maxApiCalls":
      return 0; // implement if you track API calls
    case "maxStorageGB":
      return 0; // implement from file storage total
    default:
      return 0;
  }
}

/**
 * Middleware: checkPlanLimit(limitType).
 * Requires tenantMiddleware (req.tenantId). Returns 403 with message if limit reached.
 */
export function checkPlanLimit(limitType: PlanLimitType) {
  return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(403).json({ error: "Tenant context required" });
      return;
    }
    const sub = await prisma.subscription.findFirst({
      where: { tenantId, status: { in: ["trial", "active"] } },
      orderBy: { createdAt: "desc" },
      include: { plan: { include: { limits: true } } },
    });
    const limits = sub?.plan?.limits;
    if (!limits) {
      next();
      return;
    }
    const limitValue =
      limitType === "maxUsers"
        ? limits.maxUsers
        : limitType === "maxModules"
          ? limits.maxModules
          : limitType === "maxRecords"
            ? limits.maxRecords
            : limitType === "maxAutomations"
              ? limits.maxAutomations
              : limitType === "maxApiCalls"
                ? limits.maxApiCalls
                : limits.maxStorageGB;
    if (limitValue == null) {
      next();
      return;
    }
    const current = await getCurrentCount(tenantId, limitType);
    if (current >= limitValue) {
      const message =
        limitType === "maxUsers"
          ? "User limit reached for current plan."
          : limitType === "maxModules"
            ? "Module limit reached for current plan."
            : limitType === "maxRecords"
              ? "Record limit reached for current plan."
              : limitType === "maxAutomations"
                ? "Automation limit reached for current plan."
                : "Limit reached for current plan.";
      res.status(403).json({ error: message });
      return;
    }
    next();
  };
}
