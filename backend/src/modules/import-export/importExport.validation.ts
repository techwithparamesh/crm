import { z } from "zod";

export const runImportSchema = z.object({
  moduleId: z.string().min(1),
  mapping: z.record(z.string(), z.string()),
  useJobQueue: z.boolean().optional(),
});

export const exportQuerySchema = z.object({
  moduleId: z.string().min(1),
  format: z.enum(["csv", "excel"]),
  fields: z.string().optional(), // comma-separated field keys
});
