import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as fieldsService from "./fields.service.js";
import { createFieldSchema, updateFieldSchema } from "./fields.validation.js";

const router = Router();

// POST /modules/:moduleId/fields — create field for module
router.post("/:moduleId/fields", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const { moduleId } = req.params;
    const body = createFieldSchema.parse(req.body);
    const field = await fieldsService.createField(tenantId, moduleId, body);
    res.status(201).json(field);
  } catch (e) {
    next(e);
  }
});

// GET /modules/:moduleId/fields
router.get("/:moduleId/fields", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const fields = await fieldsService.listFieldsByModule(tenantId, req.params.moduleId);
    res.json(fields);
  } catch (e) {
    next(e);
  }
});

// GET /modules/fields/:id — get single field by id
router.get("/fields/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const field = await fieldsService.getFieldById(tenantId, req.params.id);
    res.json(field);
  } catch (e) {
    next(e);
  }
});

// PUT /modules/fields/:id — we mount this under /modules so path is /modules/fields/:id
// Actually the spec says PUT /fields/:id. So we need a separate router for fields by id.
// Let me add a second router in index that uses prefix /modules for module-scoped and also mount fields at /fields for put/delete by id.
// Simplest: keep routes under /modules and use PUT /modules/fields/:id and DELETE /modules/fields/:id.
router.put("/fields/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = updateFieldSchema.parse(req.body);
    const field = await fieldsService.updateField(tenantId, req.params.id, body);
    res.json(field);
  } catch (e) {
    next(e);
  }
});

router.delete("/fields/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await fieldsService.deleteField(tenantId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
