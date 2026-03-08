/**
 * Shared config for dynamic form fields (defaults, option parsing).
 */

import type { Field } from "@/lib/api";

export const FIELD_TYPES = [
  "text",
  "number",
  "email",
  "phone",
  "textarea",
  "dropdown",
  "multi_select",
  "checkbox",
  "date",
  "currency",
  "file",
  "boolean",
  "relation",
  "user",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export function getDefaultValue(field: Field): unknown {
  if (field.defaultValue != null && field.defaultValue !== "") return field.defaultValue;
  switch (field.fieldType) {
    case "number":
    case "currency":
      return undefined;
    case "checkbox":
    case "boolean":
      return false;
    case "multi_select":
      return [];
    case "relation":
    case "user":
      return ""; // store linked record id or user id
    default:
      return "";
  }
}

export function parseOptions(optionsJSON: string | null): string[] {
  if (!optionsJSON?.trim()) return [];
  try {
    const parsed = JSON.parse(optionsJSON) as unknown;
    if (Array.isArray(parsed)) return parsed.map(String);
    if (parsed && typeof parsed === "object" && "choices" in parsed && Array.isArray((parsed as { choices: unknown[] }).choices)) {
      return (parsed as { choices: unknown[] }).choices.map(String);
    }
    return [];
  } catch {
    return [];
  }
}

export function buildDefaultValues(fields: Field[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) out[f.fieldKey] = getDefaultValue(f);
  return out;
}
