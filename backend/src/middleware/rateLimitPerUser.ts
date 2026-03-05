/**
 * Per-user rate limiting: 100 requests per minute per user (when authenticated).
 * Uses in-memory store. Apply after auth middleware on protected routes.
 */

import rateLimit from "express-rate-limit";
import type { AuthRequest } from "./authMiddleware.js";

const windowMs = 60 * 1000; // 1 minute
const maxPerUser = parseInt(process.env.RATE_LIMIT_PER_USER_MAX ?? "100", 10);

export const rateLimitPerUser = rateLimit({
  windowMs,
  max: maxPerUser,
  message: { error: "Too many requests. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (userId) return `user:${userId}`;
    return req.ip ?? req.socket?.remoteAddress ?? "unknown";
  },
});
