import { prisma } from "../../prisma/client.js";
import type { CreateWebhookInput } from "./webhooks.validation.js";

export async function createWebhook(tenantId: string, input: CreateWebhookInput) {
  return prisma.webhook.create({
    data: {
      tenantId,
      eventType: input.eventType,
      targetUrl: input.targetUrl,
      secretKey: input.secretKey ?? null,
      isActive: input.isActive ?? true,
    },
  });
}

export async function listWebhooks(tenantId: string) {
  return prisma.webhook.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteWebhook(tenantId: string, id: string) {
  await prisma.webhook.deleteMany({
    where: { id, tenantId },
  });
}

export async function updateWebhook(tenantId: string, id: string, data: { isActive?: boolean }) {
  return prisma.webhook.updateMany({
    where: { id, tenantId },
    data,
  });
}
