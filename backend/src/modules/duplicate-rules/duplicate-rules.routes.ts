import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as duplicateRulesService from "./duplicate-rules.service.js";

const router = Router();

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const moduleId = req.query.moduleId as string | undefined;
    const rules = await duplicateRulesService.listRules(tenantId, moduleId);
    res.json(rules);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const { moduleId, fieldKey } = req.body;
    if (!moduleId || !fieldKey) {
      return res.status(400).json({ error: "moduleId and fieldKey required" });
    }
    const rule = await duplicateRulesService.createRule(tenantId, { moduleId, fieldKey });
    res.status(201).json(rule);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await duplicateRulesService.deleteRule(tenantId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
