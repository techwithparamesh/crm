import { z } from "zod";

const webhookEventTypes = ["record_created", "record_updated", "record_deleted", "stage_changed", "task_created"] as const;

export const createWebhookSchema = z.object({
  eventType: z.enum(webhookEventTypes),
  targetUrl: z.string().url(),
  secretKey: z.string().max(512).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type WebhookEventType = (typeof webhookEventTypes)[number];
