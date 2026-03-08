import { z } from "zod";

const slugRegex = /^[a-z0-9_-]+$/;

export const createModuleSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(slugRegex, "Slug: lowercase letters, numbers, underscore, hyphen only"),
  icon: z.string().optional().default("folder"),
  description: z.string().optional(),
  isSystem: z.boolean().optional().default(false),
  isTemplate: z.boolean().optional().default(false),
  orderIndex: z.number().int().optional().default(0),
});

export const updateModuleSchema = createModuleSchema.partial();

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
