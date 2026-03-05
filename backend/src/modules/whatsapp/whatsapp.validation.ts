import { z } from "zod";

export const sendMessageSchema = z.object({
  phoneNumber: z.string().min(1),
  messageBody: z.string().min(1).max(4096),
  recordId: z.string().cuid().optional().nullable(),
  conversationId: z.string().cuid().optional().nullable(),
});

export const sendTemplateSchema = z.object({
  phoneNumber: z.string().min(1),
  templateId: z.string().cuid(),
  variables: z.record(z.string()).optional().default({}),
  recordId: z.string().cuid().optional().nullable(),
  conversationId: z.string().cuid().optional().nullable(),
});

export const broadcastSchema = z.object({
  templateId: z.string().cuid(),
  recipients: z.array(
    z.object({
      phoneNumber: z.string().min(1),
      variables: z.record(z.string()).optional().default({}),
      recordId: z.string().cuid().optional().nullable(),
    })
  ),
});

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  templateBody: z.string().min(1).max(4096),
  variablesJSON: z.string().optional().nullable(),
  providerTemplateId: z.string().max(255).optional().nullable(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SendTemplateInput = z.infer<typeof sendTemplateSchema>;
export type BroadcastInput = z.infer<typeof broadcastSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
