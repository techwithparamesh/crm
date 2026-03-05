import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as webhooksService from "./webhooks.service.js";
import { createWebhookSchema } from "./webhooks.validation.js";

const router = Router();

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = createWebhookSchema.parse(req.body);
    const webhook = await webhooksService.createWebhook(tenantId, body);
    res.status(201).json(webhook);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await webhooksService.listWebhooks(tenantId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await webhooksService.deleteWebhook(tenantId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
