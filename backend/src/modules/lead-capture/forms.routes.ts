import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { tenantMiddleware } from "../../middleware/tenantMiddleware.js";
import { rateLimitPerUser } from "../../middleware/rateLimitPerUser.js";
import * as formsService from "./forms.service.js";
import { createFormSchema, updateFormSchema, submitFormSchema } from "./forms.validation.js";
import { verifyRecaptcha } from "./recaptcha.service.js";
import { getEmbedScriptContent } from "./embed-script.js";

const router = Router();

const FORM_SUBMIT_RATE_LIMIT = 10;
const formSubmitRateLimitMap = new Map<string, { count: number; resetAt: number }>();

function formSubmitRateLimit(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) {
  const key = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000;
  let entry = formSubmitRateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    formSubmitRateLimitMap.set(key, entry);
  }
  entry.count++;
  if (entry.count > FORM_SUBMIT_RATE_LIMIT) {
    return res.status(429).json({ error: "Too many form submissions. Try again later." });
  }
  next();
}

/** Public: embeddable script. */
router.get("/embed.js", (_req, res) => {
  const apiBase = process.env.PUBLIC_API_URL || "";
  const script = getEmbedScriptContent(apiBase || "http://localhost:4000");
  res.setHeader("Content-Type", "application/javascript");
  res.send(script);
});

/** Public: get form config for embed (no auth). */
router.get("/:formId/config", async (req, res, next) => {
  try {
    const { formId } = req.params;
    const config = await formsService.getFormConfigPublic(formId);
    if (!config) return res.status(404).json({ error: "Form not found or inactive" });
    await formsService.incrementFormViewCount(formId);
    res.json(config);
  } catch (e) {
    next(e);
  }
});

/** Public: submit form (rate limited by IP). */
router.post("/:formId/submit", formSubmitRateLimit, async (req, res, next) => {
  try {
    const { formId } = req.params;
    const body = submitFormSchema.parse(req.body);
    const formConfig = await formsService.getFormConfigPublic(formId);
    if (!formConfig) return res.status(404).json({ error: "Form not found or inactive" });

    if (formConfig.recaptchaEnabled) {
      const token = body.recaptchaToken;
      if (!token) return res.status(400).json({ error: "reCAPTCHA required" });
      const valid = await verifyRecaptcha(token);
      if (!valid) return res.status(400).json({ error: "reCAPTCHA verification failed" });
    }

    const sourceIP = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = req.headers["user-agent"];

    const result = await formsService.submitForm(formId, body.values, { sourceIP, userAgent });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/** Protected below. */
router.use(authMiddleware, rateLimitPerUser, tenantMiddleware);

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = createFormSchema.parse(req.body);
    const created = await formsService.createForm(tenantId, body);
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await formsService.listForms(tenantId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get("/:formId", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const form = await formsService.getFormById(tenantId, req.params.formId);
    res.json(form);
  } catch (e) {
    next(e);
  }
});

router.patch("/:formId", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = updateFormSchema.partial().parse(req.body);
    const updated = await formsService.updateForm(tenantId, req.params.formId, body);
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.get("/:formId/submissions", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const list = await formsService.listSubmissions(tenantId, req.params.formId, limit);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get("/:formId/analytics", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const analytics = await formsService.getFormAnalytics(tenantId, req.params.formId);
    res.json(analytics);
  } catch (e) {
    next(e);
  }
});

export default router;
