import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as recordRelationsService from "./record-relations.service.js";
import { createRecordRelationSchema } from "./record-relations.validation.js";

const router = Router();

router.get("/record/:recordId/related", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await recordRelationsService.getRelatedRecords(tenantId, req.params.recordId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = createRecordRelationSchema.parse(req.body);
    const link = await recordRelationsService.linkRecords(tenantId, body);
    res.status(201).json(link);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await recordRelationsService.unlinkRecords(tenantId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
