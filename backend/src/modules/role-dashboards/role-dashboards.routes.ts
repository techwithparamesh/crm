import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as roleDashboardsService from "./role-dashboards.service.js";

const router = Router();

/** GET /role-dashboards/for-me — dashboard assigned to current user's role */
router.get("/for-me", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const roleId = req.user!.roleId ?? null;
    const dashboard = await roleDashboardsService.getDashboardForCurrentUser(tenantId, roleId);
    if (!dashboard) return res.json({ dashboard: null });
    res.json({ dashboard: { id: dashboard.id, name: dashboard.name } });
  } catch (e) {
    next(e);
  }
});

/** GET /role-dashboards — list all role–dashboard assignments (admin) */
router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await roleDashboardsService.listRoleDashboards(tenantId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

/** POST /role-dashboards — assign dashboard to role */
router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const { roleId, dashboardId, orderIndex } = req.body;
    if (!roleId || !dashboardId) return res.status(400).json({ error: "roleId and dashboardId required" });
    const created = await roleDashboardsService.createRoleDashboard(tenantId, { roleId, dashboardId, orderIndex });
    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

/** DELETE /role-dashboards/:id */
router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await roleDashboardsService.deleteRoleDashboard(tenantId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
