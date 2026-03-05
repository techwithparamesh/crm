import { z } from "zod";

export const installTemplateSchema = z.object({
  templateId: z.string().cuid(),
});

export type InstallTemplateInput = z.infer<typeof installTemplateSchema>;
