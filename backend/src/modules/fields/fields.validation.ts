import { z } from "zod";

const fieldKeyRegex = /^[a-z][a-z0-9_]*$/;
const fieldTypes = [
  "text", "number", "email", "phone", "textarea", "dropdown", "multi_select",
  "checkbox", "date", "currency", "file", "boolean",
] as const;

export const createFieldSchema = z.object({
  label: z.string().min(1),
  fieldKey: z.string().min(1).regex(fieldKeyRegex, "fieldKey: start with letter, then letters/numbers/underscore"),
  fieldType: z.enum(fieldTypes),
  isRequired: z.boolean().optional().default(false),
  isUnique: z.boolean().optional().default(false),
  optionsJSON: z.string().optional(), // JSON string for dropdown options etc.
  defaultValue: z.string().optional(),
  orderIndex: z.number().int().optional().default(0),
});

export const updateFieldSchema = createFieldSchema.partial();

export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;
