import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as relationshipsService from "./relationships.service.js";
import { createRelationshipSchema, updateRelationshipSchema } from "./relationships.validation.js";

const router = Router();

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = createRelationshipSchema.parse(req.body);
    const rel = await relationshipsService.createRelationship(tenantId, body);
    res.status(201).json(rel);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const moduleId = req.query.moduleId as string | undefined;
    const list = await relationshipsService.listRelationships(tenantId, moduleId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const rel = await relationshipsService.getRelationshipById(tenantId, req.params.id);
    res.json(rel);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = updateRelationshipSchema.parse(req.body);
    const rel = await relationshipsService.updateRelationship(tenantId, req.params.id, body);
    res.json(rel);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await relationshipsService.deleteRelationship(tenantId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
