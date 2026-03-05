import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { tenantMiddleware } from "../../middleware/tenantMiddleware.js";
import * as billingService from "./billing.service.js";
import { subscribeSchema, changePlanSchema } from "./billing.validation.js";

const router = Router();

/** GET /billing/plans — list active plans with limits */
router.get("/plans", authMiddleware, async (_req, res, next) => {
  try {
    const plans = await billingService.getPlans();
    res.json(plans);
  } catch (e) {
    next(e);
  }
});

/** GET /billing/subscription — current subscription for tenant */
router.get("/subscription", authMiddleware, tenantMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const sub = await billingService.getCurrentSubscription(tenantId);
    res.json(sub != null ? sub : { subscription: null });
  } catch (e) {
    next(e);
  }
});

/** GET /billing/invoices — list invoices for tenant */
router.get("/invoices", authMiddleware, tenantMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const limit = req.query.limit ? Math.min(100, parseInt(String(req.query.limit), 10)) : 20;
    const invoices = await billingService.getInvoices(tenantId, limit);
    res.json(invoices);
  } catch (e) {
    next(e);
  }
});

/** POST /billing/subscribe — subscribe to a plan (after trial or new) */
router.post("/subscribe", authMiddleware, tenantMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = subscribeSchema.parse(req.body);
    const result = await billingService.subscribe(tenantId, body.planId, body.billingCycle);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/** POST /billing/change-plan — change to another plan */
router.post("/change-plan", authMiddleware, tenantMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = changePlanSchema.parse(req.body);
    await billingService.changePlan(tenantId, body.planId, body.billingCycle);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

/** POST /billing/cancel — cancel current subscription */
router.post("/cancel", authMiddleware, tenantMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await billingService.cancelSubscription(tenantId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
