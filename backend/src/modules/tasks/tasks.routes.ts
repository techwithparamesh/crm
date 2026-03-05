import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as tasksService from "./tasks.service.js";
import { createTaskSchema, updateTaskSchema } from "./tasks.validation.js";

const router = Router();

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = createTaskSchema.parse(req.body);
    const task = await tasksService.createTask(tenantId, body, req.user!.id);
    res.status(201).json(task);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const assignedTo = req.query.assignedTo as string | undefined;
    const status = req.query.status as string | undefined;
    const relatedRecordId = req.query.relatedRecordId as string | undefined;
    const list = await tasksService.listTasks(tenantId, { assignedTo, status, relatedRecordId });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const task = await tasksService.getTaskById(tenantId, req.params.id);
    res.json(task);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = updateTaskSchema.parse(req.body);
    const task = await tasksService.updateTask(tenantId, req.params.id, body);
    res.json(task);
  } catch (e) {
    next(e);
  }
});

export default router;
