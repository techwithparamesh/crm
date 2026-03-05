import { z } from "zod";

export const createRecordRelationSchema = z.object({
  relationshipId: z.string().min(1),
  sourceRecordId: z.string().min(1),
  targetRecordId: z.string().min(1),
});

export type CreateRecordRelationInput = z.infer<typeof createRecordRelationSchema>;
