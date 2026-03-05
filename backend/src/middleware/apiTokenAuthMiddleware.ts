import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { prisma } from "../prisma/client.js";
import { hashApiToken } from "../utils/hashToken.js";
import { parsePermissions, type RolePermissions } from "../utils/permissions.js";
import type { AuthRequest } from "./authMiddleware.js";

/** Try JWT first; if not valid, try API token. Sets req.user (and req.apiToken when API token used). */
export async function authOrApiTokenMiddleware(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  if (!bearer) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  // 1) Try JWT
  try {
    const decoded = jwt.verify(bearer, config.jwt.secret) as { userId: string; tenantId: string; email: string };
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
      (req as Request & { apiToken?: unknown }).apiToken = undefined;
      next();
      return;
    }
  } catch {
    // not a valid JWT, try API token
  }

  // 2) Try API token
  const tokenHash = hashApiToken(bearer);
  const apiToken = await prisma.apiToken.findFirst({
    where: { tokenHash },
  });
  if (apiToken) {
    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: { lastUsedAt: new Date() },
    });
    req.user = {
      id: "api",
      tenantId: apiToken.tenantId,
      email: "",
      name: apiToken.name,
      roleId: null,
      permissions: null,
    };
    (req as Request & { apiToken?: { id: string; name: string } }).apiToken = { id: apiToken.id, name: apiToken.name };
    next();
    return;
  }

  res.status(401).json({ error: "Invalid or expired token" });
}
