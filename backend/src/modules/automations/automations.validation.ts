import { z } from "zod";

const triggerTypes = ["record_created", "record_updated", "stage_changed", "task_overdue", "task_due", "deal_closed"] as const;
const actionTypes = ["create_task", "send_email", "send_webhook", "update_field", "send_whatsapp_message", "create_record"] as const;

const conditionSchema = z.object({
  field: z.string().optional(),
  operator: z.string(),
  value: z.unknown(),
});

const actionSchema = z.object({
  type: z.enum(actionTypes),
  params: z.record(z.unknown()).optional(),
});

export const createAutomationSchema = z.object({
  moduleId: z.string().optional(),
  name: z.string().optional(),
  triggerType: z.enum(triggerTypes),
  conditionsJSON: z.string().optional(), // JSON string of condition[]
  actionsJSON: z.string(), // JSON string of action[]
  isActive: z.boolean().optional().default(true),
});

export const updateAutomationSchema = createAutomationSchema.partial();

export type CreateAutomationInput = z.infer<typeof createAutomationSchema>;
export type UpdateAutomationInput = z.infer<typeof updateAutomationSchema>;
export type Condition = z.infer<typeof conditionSchema>;
export type Action = z.infer<typeof actionSchema>;
