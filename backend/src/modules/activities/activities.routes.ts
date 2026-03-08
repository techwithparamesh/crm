import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as activitiesService from "./activities.service.js";

const router = Router();

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const recordId = req.query.recordId as string;
    const userId = req.query.userId as string;
    if (recordId) {
      const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 50;
      const list = await activitiesService.listActivitiesByRecordId(tenantId, recordId, limit);
      return res.json(list);
    }
    const myId = req.user!.id;
    if (userId === myId || (!recordId && !userId)) {
      const status = req.query.status as string | undefined;
      const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 50;
      const list = await activitiesService.listActivitiesForUser(tenantId, myId, { status, limit });
      return res.json(list);
    }
    return res.status(400).json({ error: "recordId or userId (own) required" });
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id === "api" ? null : req.user!.id;
    const { recordId, type, title, description, dueDate, assignedTo } = req.body;
    if (!recordId || !type || !title) {
      return res.status(400).json({ error: "recordId, type, and title required" });
    }
    if (!activitiesService.ACTIVITY_TYPES.includes(type)) {
      return res.status(400).json({ error: "Invalid type. Use: task, call, meeting, email, reminder" });
    }
    const activity = await activitiesService.createActivity(tenantId, userId, {
      recordId,
      type,
      title,
      description,
      dueDate,
      assignedTo,
    });
    res.status(201).json(activity);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const { title, description, dueDate, assignedTo, status } = req.body;
    const updated = await activitiesService.updateActivity(tenantId, req.params.id, {
      title,
      description,
      dueDate,
      assignedTo,
      status,
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await activitiesService.deleteActivity(tenantId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
