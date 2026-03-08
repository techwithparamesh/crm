import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as dashboardsService from "./dashboards.service.js";
import { createDashboardSchema, updateDashboardSchema, createWidgetSchema, updateWidgetSchema } from "./dashboards.validation.js";

const router = Router();

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = createDashboardSchema.parse(req.body);
    const dashboard = await dashboardsService.createDashboard(tenantId, body);
    res.status(201).json(dashboard);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const list = await dashboardsService.listDashboards(tenantId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

// GET /dashboard/:id — single dashboard with widgets
router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const dashboard = await dashboardsService.getDashboardById(tenantId, req.params.id);
    res.json(dashboard);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = updateDashboardSchema.parse(req.body);
    const dashboard = await dashboardsService.updateDashboard(tenantId, req.params.id, body);
    res.json(dashboard);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await dashboardsService.deleteDashboard(tenantId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

router.post("/widgets", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = createWidgetSchema.parse(req.body);
    const widget = await dashboardsService.createWidget(tenantId, body);
    res.status(201).json(widget);
  } catch (e) {
    next(e);
  }
});

router.patch("/widgets/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const body = updateWidgetSchema.parse(req.body);
    const widget = await dashboardsService.updateWidget(tenantId, req.params.id, body);
    res.json(widget);
  } catch (e) {
    next(e);
  }
});

router.delete("/widgets/:id", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    await dashboardsService.deleteWidget(tenantId, req.params.id);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
