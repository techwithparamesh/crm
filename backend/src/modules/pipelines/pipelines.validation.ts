import { z } from "zod";

export const createPipelineSchema = z.object({
  moduleId: z.string().min(1),
  name: z.string().min(1),
});

export const updatePipelineSchema = z.object({
  name: z.string().min(1).optional(),
});

export const createStageSchema = z.object({
  pipelineId: z.string().min(1),
  stageName: z.string().min(1),
  orderIndex: z.number().int().optional().default(0),
});

export const updateStageOrderSchema = z.object({
  stageIds: z.array(z.string()).min(1),
});

export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;
export type UpdatePipelineInput = z.infer<typeof updatePipelineSchema>;
export type CreateStageInput = z.infer<typeof createStageSchema>;
