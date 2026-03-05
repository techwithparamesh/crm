import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as notificationsService from "./notifications.service.js";

const router = Router();

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    if (userId === "api") {
      return res.json({ items: [], total: 0, unreadCount: 0 });
    }
    const unreadOnly = req.query.unreadOnly === "true";
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;
    const result = await notificationsService.listNotifications(tenantId, userId, {
      unreadOnly,
      limit,
      offset,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id/read", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    if (userId === "api") return res.status(403).json({ error: "Not allowed" });
    await notificationsService.markAsRead(tenantId, userId, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/read-all", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    if (userId === "api") return res.status(403).json({ error: "Not allowed" });
    await notificationsService.markAllAsRead(tenantId, userId);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
