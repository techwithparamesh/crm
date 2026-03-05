import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { tenantMiddleware } from "../../middleware/tenantMiddleware.js";
import { rateLimitPerUser } from "../../middleware/rateLimitPerUser.js";
import * as whatsappService from "./whatsapp.service.js";
import {
  sendMessageSchema,
  sendTemplateSchema,
  broadcastSchema,
  createTemplateSchema,
} from "./whatsapp.validation.js";
import { areQueuesAvailable, whatsappSendQueue } from "../../queues/queues.js";

const router = Router();
// Webhook is registered in index.ts with express.raw() before json()

/** All below require auth + tenant */
router.use(authMiddleware, rateLimitPerUser, tenantMiddleware);

/** POST /whatsapp/send */
router.post("/send", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = sendMessageSchema.parse(req.body);
    const payload = {
      tenantId,
      phoneNumber: body.phoneNumber,
      type: "text" as const,
      body: body.messageBody,
      recordId: body.recordId ?? null,
      conversationId: body.conversationId ?? null,
    };
    if (areQueuesAvailable() && whatsappSendQueue) {
      await (whatsappSendQueue as unknown as { add: (d: unknown) => Promise<unknown> }).add(payload);
      return res.status(202).json({ queued: true, message: "Message queued" });
    }
    const result = await whatsappService.sendMessage(
      tenantId,
      body.phoneNumber,
      body.messageBody,
      { recordId: body.recordId, conversationId: body.conversationId }
    );
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/** POST /whatsapp/send-template */
router.post("/send-template", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = sendTemplateSchema.parse(req.body);
    const payload = {
      tenantId,
      phoneNumber: body.phoneNumber,
      type: "template" as const,
      templateId: body.templateId,
      templateVariables: body.variables ?? {},
      recordId: body.recordId ?? null,
      conversationId: body.conversationId ?? null,
    };
    if (areQueuesAvailable() && whatsappSendQueue) {
      await (whatsappSendQueue as unknown as { add: (d: unknown) => Promise<unknown> }).add(payload);
      return res.status(202).json({ queued: true, message: "Template message queued" });
    }
    const result = await whatsappService.sendTemplate(
      tenantId,
      body.phoneNumber,
      body.templateId,
      body.variables ?? {},
      { recordId: body.recordId, conversationId: body.conversationId }
    );
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/** POST /whatsapp/broadcast */
router.post("/broadcast", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = broadcastSchema.parse(req.body);
    const result = await whatsappService.broadcastTemplate(
      tenantId,
      body.templateId,
      body.recipients
    );
    res.status(200).json(result);
  } catch (e) {
    next(e);
  }
});

/** GET /whatsapp/messages?conversationId= or ?recordId= */
router.get("/messages", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const conversationId = req.query.conversationId as string | undefined;
    const recordId = req.query.recordId as string | undefined;
    if (conversationId) {
      const list = await whatsappService.listMessages(tenantId, conversationId);
      return res.json(list);
    }
    if (recordId) {
      const list = await whatsappService.listMessagesByRecord(tenantId, recordId);
      return res.json(list);
    }
    res.status(400).json({ error: "conversationId or recordId required" });
  } catch (e) {
    next(e);
  }
});

/** GET /whatsapp/conversations?recordId= */
router.get("/conversations", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const recordId = (req.query.recordId as string) || undefined;
    const list = await whatsappService.listConversations(tenantId, recordId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/** POST /whatsapp/templates */
router.post("/templates", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = createTemplateSchema.parse(req.body);
    const created = await whatsappService.createTemplate(tenantId, {
      name: body.name,
      templateBody: body.templateBody,
      variablesJSON: body.variablesJSON ?? null,
      providerTemplateId: body.providerTemplateId ?? null,
    });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

/** GET /whatsapp/templates */
router.get("/templates", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await whatsappService.listTemplates(tenantId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

export default router;
