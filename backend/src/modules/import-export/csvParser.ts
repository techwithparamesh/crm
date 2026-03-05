import { parse } from "csv-parse/sync";

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

/**
 * Parse CSV buffer (with or without BOM) into headers and rows.
 */
export function parseCsv(buffer: Buffer): ParsedCsv {
  const str = buffer.toString("utf-8").replace(/^\uFEFF/, "");
  const parsed = parse(str, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];
  const headers = parsed.length > 0 ? Object.keys(parsed[0]) : [];
  return {
    headers,
    rows: parsed,
    rowCount: parsed.length,
  };
}
