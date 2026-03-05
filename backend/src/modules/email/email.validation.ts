import { z } from "zod";

export const smtpConfigSchema = z.object({
  host: z.string().min(1).max(255),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean().optional().default(false),
  user: z.string().min(1).max(255),
  password: z.string().max(512).optional(), // optional on update (keep existing)
  fromEmail: z.string().email().max(255),
  fromName: z.string().max(255).optional().nullable(),
});

export const sendEmailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(500),
  body: z.string().max(50000),
  recordId: z.string().cuid().optional().nullable(),
});

export type SmtpConfigInput = z.infer<typeof smtpConfigSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
