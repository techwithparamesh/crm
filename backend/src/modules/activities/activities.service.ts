/**
 * Advanced activities: task, call, meeting, email, reminder.
 * Structured activity model with assignee and due date.
 */

import { prisma } from "../../prisma/client.js";
import { createNotification } from "../notifications/notifications.service.js";
import { logActivity } from "../activity-log/activity-log.service.js";

export const ACTIVITY_TYPES = ["task", "call", "meeting", "email", "reminder"] as const;
export const ACTIVITY_STATUSES = ["pending", "completed", "cancelled"] as const;

export interface CreateActivityInput {
  recordId: string;
  type: (typeof ACTIVITY_TYPES)[number];
  title: string;
  description?: string | null;
  dueDate?: string | null;
  assignedTo?: string | null;
}

export interface UpdateActivityInput {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  assignedTo?: string | null;
  status?: (typeof ACTIVITY_STATUSES)[number];
}

export async function createActivity(
  tenantId: string,
  createdBy: string | null,
  input: CreateActivityInput
) {
  const record = await prisma.record.findFirst({
    where: { id: input.recordId, tenantId },
  });
  if (!record) throw new Error("Record not found");

  const activity = await prisma.activity.create({
    data: {
      tenantId,
      recordId: input.recordId,
      type: input.type,
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      assignedTo: input.assignedTo ?? null,
      createdBy: createdBy ?? null,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  logActivity({
    tenantId,
    recordId: input.recordId,
    userId: createdBy,
    eventType: "task_created",
    metadata: { activityId: activity.id, title: activity.title },
  }).catch(() => {});

  if (activity.assignedTo && activity.assignedTo !== createdBy) {
    createNotification({
      tenantId,
      userId: activity.assignedTo,
      type: "task_assigned",
      title: "Activity assigned",
      message: `${activity.title} (${activity.type})`,
      link: `/record/${input.recordId}`,
      entityType: "activity",
      entityId: activity.id,
    }).catch(() => {});
  }

  return activity;
}

export async function listActivitiesByRecordId(tenantId: string, recordId: string, limit = 50) {
  const record = await prisma.record.findFirst({
    where: { id: recordId, tenantId },
  });
  if (!record) throw new Error("Record not found");

  return prisma.activity.findMany({
    where: { tenantId, recordId },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: Math.min(limit, 100),
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listActivitiesForUser(
  tenantId: string,
  userId: string,
  options: { status?: string; limit?: number } = {}
) {
  const { status = "pending", limit = 50 } = options;
  return prisma.activity.findMany({
    where: {
      tenantId,
      assignedTo: userId,
      ...(status ? { status } : {}),
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: Math.min(limit, 100),
    include: {
      record: { select: { id: true, moduleId: true }, include: { module: { select: { name: true, slug: true } } } },
      creator: { select: { id: true, name: true } },
    },
  });
}

export async function updateActivity(
  tenantId: string,
  activityId: string,
  input: UpdateActivityInput
) {
  const activity = await prisma.activity.findFirst({
    where: { id: activityId, tenantId },
  });
  if (!activity) throw new Error("Activity not found");

  const data: {
    title?: string;
    description?: string | null;
    dueDate?: Date | null;
    assignedTo?: string | null;
    status?: string;
  } = {};
  if (input.title !== undefined) data.title = input.title.trim();
  if (input.description !== undefined) data.description = input.description?.trim() ?? null;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  if (input.assignedTo !== undefined) data.assignedTo = input.assignedTo ?? null;
  if (input.status !== undefined) data.status = input.status;

  const updated = await prisma.activity.update({
    where: { id: activityId },
    data,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  if (input.status === "completed") {
    logActivity({
      tenantId,
      recordId: activity.recordId,
      userId: null,
      eventType: "task_completed",
      metadata: { activityId: updated.id, title: updated.title },
    }).catch(() => {});
  }

  return updated;
}

export async function deleteActivity(tenantId: string, activityId: string) {
  const activity = await prisma.activity.findFirst({
    where: { id: activityId, tenantId },
  });
  if (!activity) throw new Error("Activity not found");
  await prisma.activity.delete({ where: { id: activityId } });
}
