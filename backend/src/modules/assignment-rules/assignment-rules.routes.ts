import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as assignmentRulesService from "./assignment-rules.service.js";

const router = Router();

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const moduleId = req.query.moduleId as string | undefined;
    const rules = await assignmentRulesService.listRules(tenantId, moduleId);
    res.json(rules);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const { moduleId, name, conditionsJSON, assignToUserId, orderIndex } = req.body;
    if (!moduleId || !name || !conditionsJSON) {
      return res.status(400).json({ error: "moduleId, name, and conditionsJSON required" });
    }
    const rule = await assignmentRulesService.createRule(tenantId, {
      moduleId,
      name,
      conditionsJSON: typeof conditionsJSON === "string" ? conditionsJSON : JSON.stringify(conditionsJSON),
      assignToUserId,
      orderIndex,
    });
    res.status(201).json(rule);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const { name, conditionsJSON, assignToUserId, orderIndex, isActive } = req.body;
    const updated = await assignmentRulesService.updateRule(tenantId, req.params.id, {
      name,
      conditionsJSON: typeof conditionsJSON === "string" ? conditionsJSON : undefined,
      assignToUserId,
      orderIndex,
      isActive,
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await assignmentRulesService.deleteRule(tenantId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
