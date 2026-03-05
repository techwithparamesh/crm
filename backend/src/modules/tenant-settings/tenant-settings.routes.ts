import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import { authMiddleware, optionalAuthMiddleware } from "../../middleware/authMiddleware.js";
import { tenantMiddleware } from "../../middleware/tenantMiddleware.js";
import type { Request } from "express";
import * as tenantSettingsService from "./tenant-settings.service.js";
import { updateTenantSettingsSchema, uploadImageSchema } from "./tenant-settings.validation.js";

const router = Router();

/** GET /tenant/settings — returns current tenant's settings (auth required) */
router.get("/settings", authMiddleware, tenantMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const settings = await tenantSettingsService.getSettings(tenantId);
    res.json(settings);
  } catch (e) {
    next(e);
  }
});

/** PUT /tenant/settings — update current tenant's settings */
router.put("/settings", authMiddleware, tenantMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = updateTenantSettingsSchema.parse(req.body);
    const settings = await tenantSettingsService.updateSettings(tenantId, body);
    res.json(settings);
  } catch (e) {
    next(e);
  }
});

/** POST /tenant/settings/upload — upload logo or favicon (base64), returns URL */
router.post("/settings/upload", authMiddleware, tenantMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = uploadImageSchema.parse(req.body);
    const url = await tenantSettingsService.saveUpload(tenantId, body.type, body.data);
    res.json({ url });
  } catch (e) {
    next(e);
  }
});

/** GET /tenant/branding — public: returns branding for tenant (by domain or tenantId query or JWT). Used for login page and initial load. */
router.get("/branding", optionalAuthMiddleware, async (req: Request & { tenantIdFromDomain?: string; user?: AuthRequest["user"] }, res, next) => {
  try {
    const tenantIdFromDomain = req.tenantIdFromDomain;
    const tenantIdQuery = req.query.tenantId as string | undefined;
    const authUser = req.user;

    let tenantId: string | undefined;
    if (tenantIdFromDomain) tenantId = tenantIdFromDomain;
    else if (tenantIdQuery) tenantId = tenantIdQuery;
    else if (authUser?.tenantId) tenantId = authUser.tenantId;

    if (!tenantId) {
      return res.json({
        companyName: null,
        logoUrl: null,
        faviconUrl: null,
        primaryColor: null,
        secondaryColor: null,
      });
    }

    const settings = await tenantSettingsService.getSettings(tenantId);
    res.json({
      companyName: settings.companyName,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
