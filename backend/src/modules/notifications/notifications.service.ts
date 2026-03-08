import { prisma } from "../../prisma/client.js";
import { mergeWhere } from "../../utils/tenantScopedRepository.js";

export const NOTIFICATION_TYPES = [
  "task_assigned",
  "record_created",
  "stage_changed",
  "automation_triggered",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface CreateNotificationInput {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message?: string | null;
  link?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  metadataJSON?: string | null;
}

export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      tenantId: input.tenantId,
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      link: input.link ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadataJSON: input.metadataJSON ?? null,
    },
  });
}

/** Notify multiple users (e.g. assignee + creator). */
export async function createNotificationForUsers(
  userIds: string[],
  input: Omit<CreateNotificationInput, "userId">
) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.filter(Boolean).map((userId) => ({
      tenantId: input.tenantId,
      userId,
      type: input.type,
      title: input.title,
      message: input.message ?? null,
      link: input.link ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadataJSON: input.metadataJSON ?? null,
    })),
  });
}

export async function listNotifications(
  tenantId: string,
  userId: string,
  options: { unreadOnly?: boolean; limit?: number; offset?: number } = {}
) {
  const { unreadOnly = false, limit = 50, offset = 0 } = options;
  const where = mergeWhere(tenantId, { userId, ...(unreadOnly ? { readAt: null } : {}) });
  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 100),
      skip: offset,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { tenantId, userId, readAt: null } }),
  ]);
  return { items, total, unreadCount };
}

export async function markAsRead(tenantId: string, userId: string, notificationId: string) {
  await prisma.notification.updateMany({
    where: { id: notificationId, tenantId, userId },
    data: { readAt: new Date() },
  });
}

export async function markAllAsRead(tenantId: string, userId: string) {
  await prisma.notification.updateMany({
    where: { tenantId, userId, readAt: null },
    data: { readAt: new Date() },
  });
}
