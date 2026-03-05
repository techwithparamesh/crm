import { z } from "zod";

const formFieldConfigSchema = z.object({
  fieldKey: z.string(),
  type: z.string(),
  required: z.boolean().optional().default(false),
  label: z.string().optional(),
});

export const createFormSchema = z.object({
  moduleId: z.string().cuid(),
  formName: z.string().min(1).max(255),
  fieldsJSON: z.string(), // JSON array of FormFieldConfig
  redirectUrl: z.string().url().optional().nullable(),
  successMessage: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  recaptchaEnabled: z.boolean().optional().default(false),
  autoAssignUserId: z.string().cuid().optional().nullable(),
});

export const updateFormSchema = createFormSchema.partial();

export const submitFormSchema = z.object({
  values: z.record(z.unknown()),
  recaptchaToken: z.string().optional().nullable(), // for reCAPTCHA v2/v3
});

export const webhookLeadsSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  source: z.string().optional(),
  moduleId: z.string().cuid().optional(),
}).catchall(z.unknown()); // allow any extra fields to map to module fields

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormInput = z.infer<typeof updateFormSchema>;
export type SubmitFormInput = z.infer<typeof submitFormSchema>;
export type WebhookLeadsPayload = z.infer<typeof webhookLeadsSchema>;
