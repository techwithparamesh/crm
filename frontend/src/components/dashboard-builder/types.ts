/** Widget config stored in configJSON */
export interface WidgetConfig {
  moduleId: string;
  title?: string;
  /** Stage filter for records (optional) */
  filters?: { stageId?: string };
  /** metric_card */
  metricType?: "count" | "sum" | "average";
  valueField?: string;
  /** bar_chart, pie_chart */
  categoryField?: string;
  valueAgg?: "count" | "sum";
  /** table */
  columns?: string[];
  limit?: number;
}

export const WIDGET_TYPES = [
  { value: "metric_card", label: "Metric card" },
  { value: "bar_chart", label: "Bar chart" },
  { value: "pie_chart", label: "Pie chart" },
  { value: "table", label: "Table" },
] as const;

export type WidgetType = (typeof WIDGET_TYPES)[number]["value"];

export function parseWidgetConfig(json: string | null): WidgetConfig {
  if (!json?.trim()) return { moduleId: "" };
  try {
    const o = JSON.parse(json) as Record<string, unknown>;
    return {
      moduleId: typeof o.moduleId === "string" ? o.moduleId : "",
      title: typeof o.title === "string" ? o.title : undefined,
      filters: o.filters && typeof o.filters === "object" && o.filters !== null ? { stageId: (o.filters as { stageId?: string }).stageId } : undefined,
      metricType: o.metricType === "count" || o.metricType === "sum" || o.metricType === "average" ? o.metricType : undefined,
      valueField: typeof o.valueField === "string" ? o.valueField : undefined,
      categoryField: typeof o.categoryField === "string" ? o.categoryField : undefined,
      valueAgg: o.valueAgg === "count" || o.valueAgg === "sum" ? o.valueAgg : undefined,
      columns: Array.isArray(o.columns) ? o.columns.filter((c): c is string => typeof c === "string") : undefined,
      limit: typeof o.limit === "number" ? o.limit : undefined,
    };
  } catch {
    return { moduleId: "" };
  }
}

export function stringifyWidgetConfig(config: WidgetConfig): string {
  const out: Record<string, unknown> = { moduleId: config.moduleId };
  if (config.title) out.title = config.title;
  if (config.filters?.stageId) out.filters = { stageId: config.filters.stageId };
  if (config.metricType) out.metricType = config.metricType;
  if (config.valueField) out.valueField = config.valueField;
  if (config.categoryField) out.categoryField = config.categoryField;
  if (config.valueAgg) out.valueAgg = config.valueAgg;
  if (config.columns?.length) out.columns = config.columns;
  if (config.limit != null) out.limit = config.limit;
  return JSON.stringify(out);
}
