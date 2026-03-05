import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import type { TenantRequest } from "../../middleware/tenantMiddleware.js";
import * as auditLogService from "./audit-log.service.js";

const router = Router();

router.get("/", async (req: TenantRequest, res, next) => {
  try {
    const tenantId = req.tenantId ?? (req as AuthRequest).user!.tenantId;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;
    const action = req.query.action as auditLogService.AuditAction | undefined;
    const result = await auditLogService.listAuditLogs(tenantId, { limit, offset, action });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
