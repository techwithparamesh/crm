import { Router } from "express";
import type { AuthRequest } from "../../middleware/authMiddleware.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import * as authService from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.validation.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get("/me", authMiddleware, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;
