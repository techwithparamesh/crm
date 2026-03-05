import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma/client.js";
import { config } from "../../config/index.js";
import { parsePermissions } from "../../utils/permissions.js";
import { createAuditLog } from "../audit-log/audit-log.service.js";
import { createTrialSubscription, getDefaultPlanId } from "../billing/billing.service.js";
import type { RegisterInput, LoginInput } from "./auth.validation.js";
import type { JwtPayload } from "../../middleware/authMiddleware.js";

export async function register(input: RegisterInput) {
  const existingTenant = await prisma.tenant.findFirst({
    where: { name: { equals: input.tenantName, mode: "insensitive" } },
  });
  if (existingTenant) throw new Error("Tenant name already exists");

  const tenant = await prisma.tenant.create({
    data: { name: input.tenantName, plan: "free" },
  });

  const existingUser = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: input.email.toLowerCase() },
  });
  if (existingUser) throw new Error("Email already registered for this organization");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
    },
  });

  const defaultPlanId = await getDefaultPlanId();
  if (defaultPlanId) {
    createTrialSubscription(tenant.id, defaultPlanId).catch(() => {});
  }

  const token = signToken(user.id, tenant.id, user.email);
  return { user: toUserResponse(user), tenant: { id: tenant.id, name: tenant.name }, token };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findFirst({
    where: {
      tenantId: input.tenantId,
      email: input.email.toLowerCase(),
    },
    include: { tenant: true, role: true },
  });
  if (!user) throw new Error("Invalid email or tenant");

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new Error("Invalid email or password");

  createAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    action: "login",
    entityType: "user",
    entityId: user.id,
    metadataJSON: JSON.stringify({ email: user.email }),
  }).catch(() => {});

  const token = signToken(user.id, user.tenantId, user.email);
  return {
    user: toUserResponse(user),
    tenant: { id: user.tenant.id, name: user.tenant.name },
    token,
  };
}

function signToken(userId: string, tenantId: string, email: string): string {
  const payload: JwtPayload = { userId, tenantId, email };
  return jwt.sign(
    payload,
    config.jwt.secret as jwt.Secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );
}

function toUserResponse(user: {
  id: string;
  name: string;
  email: string;
  roleId: string | null;
  role?: { permissionsJSON: string | null } | null;
}) {
  const permissions = user.role ? parsePermissions(user.role.permissionsJSON) : null;
  return { id: user.id, name: user.name, email: user.email, roleId: user.roleId, permissions };
}
