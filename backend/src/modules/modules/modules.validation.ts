import { z } from "zod";

const slugRegex = /^[a-z0-9_-]+$/;

export const createModuleSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(slugRegex, "Slug: lowercase letters, numbers, underscore, hyphen only"),
  icon: z.string().optional().default("folder"),
  description: z.string().optional(),
});

export const updateModuleSchema = createModuleSchema.partial();

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;
