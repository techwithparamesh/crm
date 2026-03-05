import { z } from "zod";

export const listFilesQuerySchema = z.object({
  recordId: z.string().cuid(),
});

export type ListFilesQuery = z.infer<typeof listFilesQuerySchema>;
