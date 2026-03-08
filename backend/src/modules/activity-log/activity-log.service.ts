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
  | "task_completed"
  | "note_added"
  | "email_sent";

export interface LogActivityParams {
  tenantId: string;
  recordId: string;
  userId: string | null;
  eventType: ActivityEventType;
  message?: string | null;
  metadata?: Record<string, unknown>;
}

function defaultMessage(eventType: ActivityEventType, metadata?: Record<string, unknown>): string {
  switch (eventType) {
    case "record_created":
      return "Record created";
    case "record_updated":
      return "Record updated";
    case "stage_changed": {
      const to = metadata?.newStageName as string | undefined;
      return to ? `Stage changed to ${to}` : "Stage changed";
    }
    case "task_created": {
      const title = metadata?.title as string | undefined;
      return title ? `Task created: ${title}` : "Task created";
    }
    case "task_completed": {
      const title = metadata?.title as string | undefined;
      return title ? `Task completed: ${title}` : "Task completed";
    }
    case "note_added":
      return "Note added";
    case "email_sent":
      return "Email sent";
    default:
      return eventType.replace(/_/g, " ");
  }
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  const { tenantId, recordId, userId, eventType, message, metadata } = params;
  const messageText = message ?? defaultMessage(eventType, metadata);
  await prisma.activityLog.create({
    data: {
      tenantId,
      recordId,
      userId: userId ?? undefined,
      eventType,
      message: messageText,
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
    message: string | null;
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
