/**
 * Optional: block CRM access when trial has expired and no active subscription.
 * Use after auth + tenant middleware. Returns 402 Payment Required when:
 * - No subscription, or
 * - Subscription status is "trial" and trialEndsAt < now
 */

import { Response, NextFunction } from "express";
import { getCurrentSubscription } from "./billing.service.js";
import type { TenantRequest } from "../../middleware/tenantMiddleware.js";

export async function subscriptionRequiredMiddleware(
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const tenantId = req.tenantId;
  if (!tenantId) {
    next();
    return;
  }
  const sub = await getCurrentSubscription(tenantId);
  if (!sub) {
    res.status(402).json({
      error: "No active subscription",
      code: "SUBSCRIPTION_REQUIRED",
    });
    return;
  }
  if (sub.status === "trial" && sub.trialEndsAt) {
    if (new Date(sub.trialEndsAt) < new Date()) {
      res.status(402).json({
        error: "Trial expired. Please subscribe to continue.",
        code: "TRIAL_EXPIRED",
      });
      return;
    }
  }
  next();
}
