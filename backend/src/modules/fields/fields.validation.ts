import { z } from "zod";

const fieldKeyRegex = /^[a-z][a-z0-9_]*$/;
const fieldTypes = [
  "text", "textarea", "number", "email", "phone", "date", "currency",
  "checkbox", "dropdown", "multi_select", "file", "relation", "user", "boolean",
] as const;

export const createFieldSchema = z.object({
  name: z.string().optional(), // optional internal name (defaults to label)
  label: z.string().min(1),
  fieldKey: z.string().min(1).regex(fieldKeyRegex, "fieldKey: start with letter, then letters/numbers/underscore"),
  fieldType: z.enum(fieldTypes),
  isRequired: z.boolean().optional().default(false),
  isUnique: z.boolean().optional().default(false),
  isSystem: z.boolean().optional().default(false),
  isSearchable: z.boolean().optional().default(true),
  isFilterable: z.boolean().optional().default(true),
  optionsJSON: z.string().optional(),
  relationModuleId: z.string().optional(),
  defaultValue: z.string().optional(),
  orderIndex: z.number().int().optional().default(0),
});

export const updateFieldSchema = createFieldSchema.partial();

export type CreateFieldInput = z.infer<typeof createFieldSchema>;
export type UpdateFieldInput = z.infer<typeof updateFieldSchema>;
