import { z } from "zod";

// Values are keyed by fieldKey. Type varies by field type.
export const createRecordSchema = z.object({
  values: z.record(z.unknown()).optional().default({}),
  pipelineStageId: z.string().optional(),
  ownerId: z.string().optional(),
  allowDuplicate: z.boolean().optional(),
});

export const updateRecordSchema = z.object({
  values: z.record(z.unknown()).optional(),
  pipelineStageId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
});

export const listRecordsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(500).optional().default(50),
  stageId: z.string().optional(),
  createdBy: z.string().optional(),
  ownerId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type ListRecordsQuery = z.infer<typeof listRecordsQuerySchema>;
