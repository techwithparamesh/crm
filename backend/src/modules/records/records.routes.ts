import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as recordsService from "./records.service.js";
import * as pipelinesService from "../pipelines/pipelines.service.js";
import { createRecordSchema, updateRecordSchema, listRecordsQuerySchema } from "./records.validation.js";

const router = Router();

function permContext(req: AuthRequest): recordsService.RecordPermissionContext | undefined {
  if (!req.user) return undefined;
  return { permissions: req.user.permissions ?? null, userId: req.user.id };
}

// POST /records — body: { moduleId, values?, pipelineStageId? }
router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const isApiToken = req.user!.id === "api";
    const createdBy = isApiToken ? null : req.user!.id;
    const { moduleId, ...rest } = req.body;
    if (!moduleId || typeof moduleId !== "string") {
      res.status(400).json({ error: "moduleId required" });
      return;
    }
    const body = createRecordSchema.parse(rest);
    const record = await recordsService.createRecord(tenantId, moduleId, createdBy, body, permContext(req));
    res.status(201).json(record);
  } catch (e) {
    next(e);
  }
});

// GET /records/:moduleId — list records for module
router.get("/:moduleId", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const query = listRecordsQuerySchema.parse(req.query);
    const result = await recordsService.listRecords(tenantId, req.params.moduleId, query, permContext(req));
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// GET /records/detail/:id — single record
router.get("/detail/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const record = await recordsService.getRecordDetail(tenantId, req.params.id, permContext(req));
    res.json(record);
  } catch (e) {
    next(e);
  }
});

// PUT /records/:id
router.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = updateRecordSchema.parse(req.body);
    const userId = req.user!.id === "api" ? null : req.user!.id;
    const record = await recordsService.updateRecord(tenantId, req.params.id, userId, body, permContext(req));
    res.json(record);
  } catch (e) {
    next(e);
  }
});

// DELETE /records/:id
router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await recordsService.deleteRecord(tenantId, req.params.id, permContext(req));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

// PATCH /records/:id/stage — body: { stageId }
router.patch("/:id/stage", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const { stageId } = req.body;
    if (!stageId || typeof stageId !== "string") {
      res.status(400).json({ error: "stageId required" });
      return;
    }
    const userId = req.user!.id === "api" ? null : req.user!.id;
    const record = await pipelinesService.updateRecordStage(tenantId, req.params.id, stageId, userId);
    res.json(record);
  } catch (e) {
    next(e);
  }
});

export default router;
