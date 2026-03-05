import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as apiTokensService from "./api-tokens.service.js";
import { createApiTokenSchema } from "./api-tokens.validation.js";

const router = Router();

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const createdBy = req.user!.id !== "api" ? req.user!.id : null;
    const body = createApiTokenSchema.parse(req.body);
    const result = await apiTokensService.createApiToken(tenantId, createdBy, body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await apiTokensService.listApiTokens(tenantId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await apiTokensService.deleteApiToken(tenantId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
