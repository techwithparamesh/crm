import { z } from "zod";

export const createApiTokenSchema = z.object({
  name: z.string().min(1).max(255),
  permissionsJSON: z.string().optional().nullable(),
});

export type CreateApiTokenInput = z.infer<typeof createApiTokenSchema>;
