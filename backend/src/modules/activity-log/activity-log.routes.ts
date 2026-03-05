import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as activityLogService from "./activity-log.service.js";

const router = Router();

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const recordId = req.query.recordId as string;
    if (!recordId) {
      return res.status(400).json({ error: "recordId query is required" });
    }
    const limit = req.query.limit ? Math.min(Number(req.query.limit), 100) : 50;
    const logs = await activityLogService.listActivityByRecordId(tenantId, recordId, limit);
    res.json(logs);
  } catch (e) {
    next(e);
  }
});

export default router;
