import { z } from "zod";

export const installTemplateSchema = z.object({
  templateId: z.string().min(1),
  workspaceId: z.string().cuid().optional(), // optional; when omitted use current user's tenantId
});

export type InstallTemplateInput = z.infer<typeof installTemplateSchema>;
