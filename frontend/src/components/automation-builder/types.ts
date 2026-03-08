/** Condition row for conditionsJSON array */
export interface AutomationCondition {
  field?: string;
  operator: string;
  value?: unknown;
}

/** Action row for actionsJSON array */
export interface AutomationAction {
  type: "create_task" | "send_email" | "send_webhook" | "update_field" | "create_record";
  params?: Record<string, unknown>;
}

/** Field mapping row for create_record action */
export interface CreateRecordFieldMapping {
  targetFieldKey: string;
  sourceType: "field" | "literal";
  sourceFieldKey?: string;
  literalValue?: unknown;
}

export const TRIGGER_OPTIONS = [
  { value: "record_created", label: "Record created" },
  { value: "record_updated", label: "Record updated" },
  { value: "stage_changed", label: "Stage changed" },
] as const;

export const CONDITION_OPERATORS = [
  { value: "eq", label: "equals" },
  { value: "neq", label: "not equals" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "gt", label: "greater than" },
  { value: "gte", label: "greater or equal" },
  { value: "lt", label: "less than" },
  { value: "lte", label: "less or equal" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
] as const;

export const ACTION_OPTIONS = [
  { value: "create_task", label: "Create task" },
  { value: "create_record", label: "Create record in module" },
  { value: "send_email", label: "Send email" },
  { value: "update_field", label: "Update field" },
  { value: "send_webhook", label: "Webhook" },
] as const;
