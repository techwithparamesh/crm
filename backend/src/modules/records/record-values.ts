/**
 * EAV value column selection and value normalization for RecordValue.
 * Used by records.service and automation engine.
 */

export type ValueColumn = "valueText" | "valueNumber" | "valueDate" | "valueJSON";

export function getValueColumn(fieldType: string): ValueColumn {
  switch (fieldType) {
    case "number":
    case "currency":
      return "valueNumber";
    case "date":
      return "valueDate";
    case "dropdown":
    case "multi_select":
    case "checkbox":
    case "boolean":
      return "valueJSON";
    default:
      return "valueText";
  }
}

export interface NormalizedValue {
  text?: string;
  number?: number;
  date?: Date;
  json?: string;
}

export function normalizeValue(fieldType: string, value: unknown): NormalizedValue {
  if (value === undefined || value === null) return {};
  switch (fieldType) {
    case "number":
    case "currency": {
      const n = typeof value === "number" ? value : Number(value);
      return Number.isFinite(n) ? { number: n } : {};
    }
    case "date": {
      const d = value instanceof Date ? value : new Date(String(value));
      return isNaN(d.getTime()) ? {} : { date: d };
    }
    case "dropdown":
    case "boolean":
      return { text: String(value) };
    case "multi_select":
    case "checkbox": {
      const arr = Array.isArray(value) ? value : [value];
      return { json: JSON.stringify(arr.map(String)) };
    }
    default:
      return { text: String(value) };
  }
}

export function buildRecordValuePayload(
  fieldType: string,
  normalized: NormalizedValue
): {
  valueText: string | null;
  valueNumber: number | null;
  valueDate: Date | null;
  valueJSON: string | null;
} {
  const col = getValueColumn(fieldType);
  return {
    valueText: col === "valueText" ? normalized.text ?? null : null,
    valueNumber: col === "valueNumber" ? normalized.number ?? null : null,
    valueDate: col === "valueDate" ? normalized.date ?? null : null,
    valueJSON: col === "valueJSON" ? normalized.json ?? null : null,
  };
}
