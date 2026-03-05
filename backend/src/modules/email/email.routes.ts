import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { tenantMiddleware } from "../../middleware/tenantMiddleware.js";
import * as emailService from "./email.service.js";
import { smtpConfigSchema, sendEmailSchema } from "./email.validation.js";

const router = Router();

/** GET /emails/smtp — get current tenant SMTP config (no password) */
router.get("/smtp", authMiddleware, tenantMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const config = await emailService.getSmtpConfig(tenantId);
    res.json(config ?? { configured: false });
  } catch (e) {
    next(e);
  }
});

/** PUT /emails/smtp — create or update SMTP config */
router.put("/smtp", authMiddleware, tenantMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = smtpConfigSchema.parse(req.body);
    const config = await emailService.upsertSmtpConfig(tenantId, body);
    res.json({
      id: config.id,
      tenantId: config.tenantId,
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
    });
  } catch (e) {
    next(e);
  }
});

/** POST /emails/send — send email (optional recordId to log in activity) */
router.post("/send", authMiddleware, tenantMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id !== "api" ? req.user!.id : null;
    const body = sendEmailSchema.parse(req.body);
    const result = await emailService.sendEmail(tenantId, {
      to: body.to,
      subject: body.subject,
      body: body.body,
      recordId: body.recordId ?? null,
      userId,
    });
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/** GET /emails/logs — list email logs (optional recordId) */
router.get("/logs", authMiddleware, tenantMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const recordId = (req.query.recordId as string) || undefined;
    const logs = await emailService.listEmailLogs(tenantId, recordId);
    res.json(logs);
  } catch (e) {
    next(e);
  }
});

export default router;
