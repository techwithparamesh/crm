import { prisma } from "../../prisma/client.js";
import { mergeWhere } from "../../utils/tenantScopedRepository.js";

export const AUDIT_ACTIONS = [
  "record_created",
  "record_updated",
  "record_deleted",
  "login",
  "permission_changed",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface CreateAuditLogInput {
  tenantId: string;
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  metadataJSON?: string | null;
}

export async function createAuditLog(input: CreateAuditLogInput): Promise<void> {
  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadataJSON: input.metadataJSON ?? null,
    },
  });
}

/** List audit logs for tenant (tenant-scoped). */
export async function listAuditLogs(
  tenantId: string,
  options: { limit?: number; offset?: number; action?: AuditAction } = {}
) {
  const { limit = 50, offset = 0, action } = options;
  const where = mergeWhere(tenantId, action ? { action } : undefined);
  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total };
}
