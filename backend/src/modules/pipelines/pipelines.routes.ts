import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as pipelinesService from "./pipelines.service.js";
import { createPipelineSchema, createStageSchema } from "./pipelines.validation.js";

const router = Router();

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = createPipelineSchema.parse(req.body);
    const pipeline = await pipelinesService.createPipeline(tenantId, body);
    res.status(201).json(pipeline);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await pipelinesService.listPipelines(tenantId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const pipeline = await pipelinesService.getPipelineById(tenantId, req.params.id);
    res.json(pipeline);
  } catch (e) {
    next(e);
  }
});

router.post("/pipeline-stages", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = createStageSchema.parse(req.body);
    const stage = await pipelinesService.createStage(tenantId, body);
    res.status(201).json(stage);
  } catch (e) {
    next(e);
  }
});

export default router;
