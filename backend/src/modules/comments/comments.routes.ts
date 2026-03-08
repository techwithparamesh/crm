import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as commentsService from "./comments.service.js";

const router = Router();

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const recordId = req.query.recordId as string;
    if (!recordId) return res.status(400).json({ error: "recordId is required" });
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 100;
    const comments = await commentsService.listCommentsByRecordId(tenantId, recordId, limit);
    res.json(comments);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    if (userId === "api") return res.status(403).json({ error: "Not allowed" });
    const { recordId, message } = req.body;
    if (!recordId || !message) return res.status(400).json({ error: "recordId and message required" });
    const comment = await commentsService.createComment(tenantId, userId, { recordId, message });
    res.status(201).json(comment);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id;
    if (userId === "api") return res.status(403).json({ error: "Not allowed" });
    await commentsService.deleteComment(tenantId, req.params.id, userId);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
