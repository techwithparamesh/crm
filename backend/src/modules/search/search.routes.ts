import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import * as searchService from "./search.service.js";

const router = Router();

/** GET /search?q=...&limitPerModule=10 — global full-text search, results grouped by module slug */
router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tenantId = req.user!.tenantId;
    const q = (req.query.q as string)?.trim() ?? "";
    const limitPerModule = req.query.limitPerModule
      ? Math.min(50, Math.max(1, parseInt(String(req.query.limitPerModule), 10)))
      : 10;
    const result = await searchService.globalSearch(tenantId, q, limitPerModule);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
