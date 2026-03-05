import { z } from "zod";

export const createRelationshipSchema = z.object({
  name: z.string().min(1, "Name required"),
  sourceModuleId: z.string().min(1, "Source module required"),
  targetModuleId: z.string().min(1, "Target module required"),
  relationshipType: z.enum(["one_to_many", "many_to_many"]),
});

export const updateRelationshipSchema = createRelationshipSchema.partial();

export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>;
export type UpdateRelationshipInput = z.infer<typeof updateRelationshipSchema>;
