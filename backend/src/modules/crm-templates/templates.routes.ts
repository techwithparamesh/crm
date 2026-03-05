import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { tenantMiddleware } from "../../middleware/tenantMiddleware.js";
import { rateLimitPerUser } from "../../middleware/rateLimitPerUser.js";
import * as templatesService from "./templates.service.js";
import { installTemplateSchema } from "./templates.validation.js";

const router = Router();

/** GET /crm-templates — list all templates (no auth for marketplace listing, or require auth) */
router.get("/", async (_req, res, next) => {
  try {
    const list = await templatesService.listTemplates();
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/** GET /crm-templates/:id — get one template (for preview) */
router.get("/:id", async (req, res, next) => {
  try {
    const template = await templatesService.getTemplateById(req.params.id);
    res.json(template);
  } catch (e) {
    next(e);
  }
});

/** POST /crm-templates/install — install template for current tenant */
router.post(
  "/install",
  authMiddleware,
  rateLimitPerUser,
  tenantMiddleware,
  async (req: AuthRequest, res, next) => {
    try {
      const tenantId = req.user!.tenantId;
      const body = installTemplateSchema.parse(req.body);
      const result = await templatesService.installCRMTemplate(body.templateId, tenantId);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
