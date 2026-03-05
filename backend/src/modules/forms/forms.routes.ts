import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { tenantMiddleware } from "../../middleware/tenantMiddleware.js";
import { rateLimitPerUser } from "../../middleware/rateLimitPerUser.js";
import * as formsService from "./forms.service.js";
import { createFormSchema, updateFormSchema, submitFormSchema } from "./forms.validation.js";

const router = Router();

const submitRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: "Too many submissions" },
  standardHeaders: true,
});

/** GET /forms/:id/config — public form config for embed script */
router.get("/:id/config", async (req, res, next) => {
  try {
    const config = await formsService.getFormConfigPublic(req.params.id);
    if (!config) return res.status(404).json({ error: "Form not found or inactive" });
    res.json(config);
  } catch (e) {
    next(e);
  }
});

/** POST /forms/:id/submit — public form submit (rate limited by IP) */
router.post("/:id/submit", submitRateLimit, async (req, res, next) => {
  try {
    const formId = req.params.id;
    const body = submitFormSchema.parse(req.body);
    const sourceIP = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? null;
    const userAgent = req.headers["user-agent"] ?? null;
    const result = await formsService.submitForm(formId, body.values, {
      sourceIP,
      userAgent,
      recaptchaToken: body.recaptchaToken ?? null,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/** POST /forms/:id/view — optional: record a view (called by embed when form is shown) */
router.post("/:id/view", submitRateLimit, async (req, res, next) => {
  try {
    await formsService.recordFormView(req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// ---------- Protected (auth + tenant) ----------
router.use(authMiddleware, rateLimitPerUser, tenantMiddleware);

/** POST /forms — create form */
router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = createFormSchema.parse(req.body);
    const form = await formsService.createForm(tenantId, body);
    res.status(201).json(form);
  } catch (e) {
    next(e);
  }
});

/** GET /forms — list forms */
router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await formsService.listForms(tenantId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/** GET /forms/:id — get form (auth) */
router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const form = await formsService.getFormById(tenantId, req.params.id);
    res.json(form);
  } catch (e) {
    next(e);
  }
});

/** PATCH /forms/:id — update form */
router.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = updateFormSchema.partial().parse(req.body);
    const form = await formsService.updateForm(tenantId, req.params.id, body);
    res.json(form);
  } catch (e) {
    next(e);
  }
});

/** GET /forms/:id/submissions — list submissions */
router.get("/:id/submissions", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const list = await formsService.listSubmissions(tenantId, req.params.id, limit);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/** GET /forms/:id/analytics — views, submissions, conversion rate */
router.get("/:id/analytics", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const analytics = await formsService.getFormAnalytics(tenantId, req.params.id);
    res.json(analytics);
  } catch (e) {
    next(e);
  }
});

export default router;
