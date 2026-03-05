import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { prisma } from "../prisma/client.js";
import { parsePermissions, type RolePermissions } from "../utils/permissions.js";

export interface JwtPayload {
  userId: string;
  tenantId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    roleId: string | null;
    permissions: RolePermissions | null;
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const user = await prisma.user.findFirst({
      where: { id: decoded.userId, tenantId: decoded.tenantId },
      include: { role: true },
    });
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const permissions = user.role
      ? parsePermissions(user.role.permissionsJSON)
      : null;
    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      roleId: user.roleId,
      permissions,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Sets req.user when valid token present; never returns 401. Use for public routes that can use auth when available (e.g. branding). */
export async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    next();
    return;
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    const user = await prisma.user.findFirst({
      where: { id: decoded.userId, tenantId: decoded.tenantId },
      include: { role: true },
    });
    if (user) {
      const permissions = user.role ? parsePermissions(user.role.permissionsJSON) : null;
      req.user = {
        id: user.id,
        tenantId: user.tenantId,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        permissions,
      };
    }
  } catch {
    // ignore
  }
  next();
}
