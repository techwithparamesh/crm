import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { tenantMiddleware } from "../../middleware/tenantMiddleware.js";
import { rateLimitPerUser } from "../../middleware/rateLimitPerUser.js";
import * as templatesService from "./templates.service.js";
import { installTemplateWithProgress } from "../../services/template-installer.service.js";
import { installTemplateSchema } from "./templates.validation.js";

const router = Router();

/** GET /crm-templates — list all templates (optional ?category= for filter) */
router.get("/", async (req, res, next) => {
  try {
    const list = await templatesService.listTemplates();
    const category = req.query.category as string | undefined;
    const filtered = category
      ? list.filter((t: { category?: string | null }) => t.category === category)
      : list;
    res.json(filtered);
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

/** POST /crm-templates/install — install template for workspace (current tenant).
 *  Query ?stream=1: response is NDJSON stream of progress events, then final { done: true, result }.
 */
router.post(
  "/install",
  authMiddleware,
  rateLimitPerUser,
  tenantMiddleware,
  async (req: AuthRequest, res, next) => {
    try {
      const tenantId = req.user!.tenantId;
      const body = installTemplateSchema.parse(req.body);
      const effectiveWorkspaceId = body.workspaceId ?? tenantId;
      const stream = req.query.stream === "1" || req.query.stream === "true";

      if (stream) {
        res.setHeader("Content-Type", "application/x-ndjson");
        res.setHeader("Transfer-Encoding", "chunked");
        res.setHeader("Cache-Control", "no-cache");
        res.flushHeaders?.();

        const send = (event: object) => {
          res.write(JSON.stringify(event) + "\n");
          res.flush?.();
        };

        try {
          await installTemplateWithProgress(body.templateId, effectiveWorkspaceId, (evt) => send(evt));
          send({ done: true, result: { installed: true } });
        } catch (err) {
          send({
            step: "error",
            message: err instanceof Error ? err.message : "Install failed",
            done: true,
            error: err instanceof Error ? err.message : "Install failed",
          });
        } finally {
          res.end();
        }
        return;
      }

      const result = await templatesService.installCRMTemplate(body.templateId, effectiveWorkspaceId);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
