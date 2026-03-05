import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as rolesService from "./roles.service.js";
import { createRoleSchema, updateRoleSchema } from "./roles.validation.js";

const router = Router();

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = createRoleSchema.parse(req.body);
    const role = await rolesService.createRole(tenantId, body);
    res.status(201).json(role);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await rolesService.listRoles(tenantId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const role = await rolesService.getRoleById(tenantId, req.params.id);
    res.json(role);
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.id === "api" ? null : req.user!.id;
    const body = updateRoleSchema.parse(req.body);
    const role = await rolesService.updateRole(tenantId, req.params.id, body, userId);
    res.json(role);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await rolesService.deleteRole(tenantId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
