import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as modulesService from "./modules.service.js";
import { createModuleSchema, updateModuleSchema } from "./modules.validation.js";

const router = Router();

function permContext(req: AuthRequest): modulesService.ModulePermissionContext | undefined {
  if (!req.user) return undefined;
  return { permissions: req.user.permissions ?? null };
}

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = createModuleSchema.parse(req.body);
    const module = await modulesService.createModule(tenantId, body, permContext(req));
    res.status(201).json(module);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await modulesService.listModules(tenantId, permContext(req));
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const module = await modulesService.getModuleById(tenantId, req.params.id, permContext(req));
    res.json(module);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = updateModuleSchema.parse(req.body);
    const module = await modulesService.updateModule(tenantId, req.params.id, body, permContext(req));
    res.json(module);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await modulesService.deleteModule(tenantId, req.params.id, permContext(req));
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
