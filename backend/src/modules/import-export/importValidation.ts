import { normalizeValue } from "../records/record-values.js";

export interface FieldMeta {
  id: string;
  fieldKey: string;
  fieldType: string;
  isRequired: boolean;
  defaultValue: string | null;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

/**
 * Validate a single value for field type. Returns error message or null.
 */
export function validateCell(
  value: string,
  field: FieldMeta
): string | null {
  const trimmed = value.trim();
  if (field.isRequired && trimmed === "") return "Required";
  if (trimmed === "") return null;

  switch (field.fieldType) {
    case "number":
    case "currency": {
      const n = Number(trimmed);
      if (!Number.isFinite(n)) return "Must be a number";
      return null;
    }
    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Invalid email";
      return null;
    case "date": {
      const d = new Date(trimmed);
      if (isNaN(d.getTime())) return "Invalid date";
      return null;
    }
    case "boolean":
    case "dropdown":
      return null;
    case "multi_select":
    case "checkbox":
      return null;
    default:
      return null;
  }
}

/**
 * Convert CSV row (string values) to record values using mapping and field types.
 */
export function rowToValues(
  row: Record<string, string>,
  mapping: Record<string, string>,
  fields: FieldMeta[],
  rowIndex = 0
): { values: Record<string, unknown>; errors: ValidationError[] } {
  const values: Record<string, unknown> = {};
  const errors: ValidationError[] = [];
  const fieldByKey = new Map(fields.map((f) => [f.fieldKey, f]));

  for (const [csvCol, fieldKey] of Object.entries(mapping)) {
    if (!fieldKey) continue;
    const field = fieldByKey.get(fieldKey);
    if (!field) continue;
    const raw = row[csvCol] ?? "";
    const err = validateCell(raw, field);
    if (err) {
      errors.push({ row: rowIndex, field: fieldKey, message: err });
      continue;
    }
    if (raw.trim() === "" && field.defaultValue != null) {
      values[fieldKey] = field.defaultValue;
      continue;
    }
    if (raw.trim() === "") continue;

    const normalized = normalizeValue(field.fieldType, raw);
    if (field.fieldType === "number" || field.fieldType === "currency") {
      values[fieldKey] = normalized.number;
    } else if (field.fieldType === "date") {
      values[fieldKey] = normalized.date;
    } else if (field.fieldType === "multi_select" || field.fieldType === "checkbox") {
      try {
        values[fieldKey] = JSON.parse(normalized.json ?? "[]");
      } catch {
        values[fieldKey] = raw.split(",").map((s) => s.trim()).filter(Boolean);
      }
    } else {
      values[fieldKey] = normalized.text ?? raw;
    }
  }
  return { values, errors };
}
