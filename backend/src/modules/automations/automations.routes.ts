import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as automationsService from "./automations.service.js";
import { createAutomationSchema, updateAutomationSchema } from "./automations.validation.js";

const router = Router();

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = createAutomationSchema.parse(req.body);
    const automation = await automationsService.createAutomation(tenantId, body);
    res.status(201).json(automation);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const moduleId = req.query.moduleId as string | undefined;
    const list = await automationsService.listAutomations(tenantId, moduleId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const automation = await automationsService.getAutomationById(tenantId, req.params.id);
    res.json(automation);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = updateAutomationSchema.parse(req.body);
    const automation = await automationsService.updateAutomation(tenantId, req.params.id, body);
    res.json(automation);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await automationsService.deleteAutomation(tenantId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
