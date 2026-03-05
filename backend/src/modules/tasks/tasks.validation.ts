import { z } from "zod";

export const createTaskSchema = z.object({
  relatedRecordId: z.string().optional(),
  assignedTo: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  dueDate: z.union([z.string(), z.date()]).optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional().default("pending"),
});

export const updateTaskSchema = createTaskSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
