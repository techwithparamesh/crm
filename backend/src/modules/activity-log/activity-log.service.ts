/**
 * Activity logging for record timeline and audit.
 * Events: record_created, record_updated, stage_changed, task_created, note_added.
 */

import { prisma } from "../../prisma/client.js";

export type ActivityEventType =
  | "record_created"
  | "record_updated"
  | "stage_changed"
  | "task_created"
  | "note_added"
  | "email_sent";

export interface LogActivityParams {
  tenantId: string;
  recordId: string;
  userId: string | null;
  eventType: ActivityEventType;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  const { tenantId, recordId, userId, eventType, metadata } = params;
  await prisma.activityLog.create({
    data: {
      tenantId,
      recordId,
      userId: userId ?? undefined,
      eventType,
      metadataJSON: metadata ? JSON.stringify(metadata) : undefined,
    },
  });
}

export async function listActivityByRecordId(
  tenantId: string,
  recordId: string,
  limit = 50
): Promise<
  Array<{
    id: string;
    eventType: string;
    userId: string | null;
    metadataJSON: string | null;
    createdAt: Date;
    user?: { id: string; name: string; email: string } | null;
  }>
> {
  const logs = await prisma.activityLog.findMany({
    where: { tenantId, recordId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return logs;
}
