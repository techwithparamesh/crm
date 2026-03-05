import { prisma } from "../../prisma/client.js";
import { logActivity } from "../activity-log/activity-log.service.js";
import { dispatchWebhooks } from "../webhooks/webhook-dispatcher.js";
import { createNotification } from "../notifications/notifications.service.js";
import type { CreateTaskInput, UpdateTaskInput } from "./tasks.validation.js";

export async function createTask(tenantId: string, input: CreateTaskInput, userId?: string | null) {
  if (input.relatedRecordId) {
    const rec = await prisma.record.findFirst({
      where: { id: input.relatedRecordId, tenantId },
    });
    if (!rec) throw new Error("Related record not found");
  }
  if (input.assignedTo) {
    const user = await prisma.user.findFirst({
      where: { id: input.assignedTo, tenantId },
    });
    if (!user) throw new Error("Assigned user not found");
  }
  const dueDate = input.dueDate
    ? typeof input.dueDate === "string"
      ? new Date(input.dueDate)
      : input.dueDate
    : undefined;
  const task = await prisma.task.create({
    data: {
      tenantId,
      relatedRecordId: input.relatedRecordId,
      assignedTo: input.assignedTo,
      title: input.title,
      description: input.description,
      dueDate,
      status: input.status ?? "pending",
    },
  });
  if (task.relatedRecordId) {
    logActivity({
      tenantId,
      recordId: task.relatedRecordId,
      userId: userId ?? null,
      eventType: "task_created",
      metadata: { taskId: task.id, title: task.title ?? undefined },
    }).catch(() => {});
    dispatchWebhooks(tenantId, "task_created", {
      recordId: task.relatedRecordId,
      tenantId,
      data: { taskId: task.id, title: task.title, description: task.description, status: task.status, dueDate: task.dueDate?.toISOString() },
    }).catch(() => {});
  }
  if (task.assignedTo && task.assignedTo !== userId) {
    createNotification({
      tenantId,
      userId: task.assignedTo,
      type: "task_assigned",
      title: "Task assigned to you",
      message: task.title ?? undefined,
      entityType: "task",
      entityId: task.id,
      metadataJSON: JSON.stringify({ relatedRecordId: task.relatedRecordId }),
    }).catch(() => {});
  }
  return task;
}

export async function listTasks(tenantId: string, filters?: { assignedTo?: string; status?: string; relatedRecordId?: string }) {
  const where: { tenantId: string; assignedTo?: string; status?: string; relatedRecordId?: string } = { tenantId };
  if (filters?.assignedTo) where.assignedTo = filters.assignedTo;
  if (filters?.status) where.status = filters.status;
  if (filters?.relatedRecordId) where.relatedRecordId = filters.relatedRecordId;
  return prisma.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    include: { assignee: true, record: true },
  });
}

export async function getTaskById(tenantId: string, id: string) {
  const t = await prisma.task.findFirst({
    where: { id, tenantId },
    include: { assignee: true, record: true },
  });
  if (!t) throw new Error("Task not found");
  return t;
}

export async function updateTask(tenantId: string, id: string, input: UpdateTaskInput) {
  const existing = await getTaskById(tenantId, id);
  const dueDate = input.dueDate
    ? typeof input.dueDate === "string"
      ? new Date(input.dueDate)
      : input.dueDate
    : undefined;
  const updated = await prisma.task.update({
    where: { id },
    data: {
      ...(input.assignedTo !== undefined && { assignedTo: input.assignedTo }),
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(dueDate !== undefined && { dueDate }),
      ...(input.status !== undefined && { status: input.status }),
    },
    include: { assignee: true },
  });
  if (input.assignedTo && input.assignedTo !== existing.assignedTo) {
    createNotification({
      tenantId,
      userId: input.assignedTo,
      type: "task_assigned",
      title: "Task assigned to you",
      message: updated.title ?? undefined,
      entityType: "task",
      entityId: updated.id,
      metadataJSON: JSON.stringify({ relatedRecordId: updated.relatedRecordId }),
    }).catch(() => {});
  }
  return updated;
}
