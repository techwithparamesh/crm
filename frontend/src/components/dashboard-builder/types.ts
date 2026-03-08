/** Widget config stored in configJSON */
export interface WidgetConfig {
  moduleId: string;
  title?: string;
  /** Stage filter for records (optional) */
  filters?: { stageId?: string };
  /** Limit to current user's records (for "My leads" style dashboards) */
  scopeOwn?: boolean;
  /** Date range: YYYY-MM-DD. For "this month" or "last 7 days" */
  dateFrom?: string;
  dateTo?: string;
  /** metric_card */
  metricType?: "count" | "sum" | "average";
  valueField?: string;
  /** bar_chart, pie_chart */
  categoryField?: string;
  valueAgg?: "count" | "sum";
  /** time_series: group records by day over date range */
  timeSeriesDays?: number;
  /** table */
  columns?: string[];
  limit?: number;
  /** quick_links */
  links?: { label: string; url: string }[];
}

export const WIDGET_TYPES = [
  { value: "metric_card", label: "Metric card" },
  { value: "bar_chart", label: "Bar chart" },
  { value: "pie_chart", label: "Pie chart" },
  { value: "time_series", label: "Time series (e.g. leads per day)" },
  { value: "table", label: "Table" },
  { value: "quick_links", label: "Quick links" },
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
      scopeOwn: o.scopeOwn === true,
      dateFrom: typeof o.dateFrom === "string" ? o.dateFrom : undefined,
      dateTo: typeof o.dateTo === "string" ? o.dateTo : undefined,
      metricType: o.metricType === "count" || o.metricType === "sum" || o.metricType === "average" ? o.metricType : undefined,
      valueField: typeof o.valueField === "string" ? o.valueField : undefined,
      categoryField: typeof o.categoryField === "string" ? o.categoryField : undefined,
      valueAgg: o.valueAgg === "count" || o.valueAgg === "sum" ? o.valueAgg : undefined,
      timeSeriesDays: typeof o.timeSeriesDays === "number" ? o.timeSeriesDays : undefined,
      columns: Array.isArray(o.columns) ? o.columns.filter((c): c is string => typeof c === "string") : undefined,
      limit: typeof o.limit === "number" ? o.limit : undefined,
      links: Array.isArray(o.links) ? o.links.filter((l): l is { label: string; url: string } => typeof l?.label === "string" && typeof l?.url === "string") : undefined,
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
  if (config.scopeOwn) out.scopeOwn = true;
  if (config.dateFrom) out.dateFrom = config.dateFrom;
  if (config.dateTo) out.dateTo = config.dateTo;
  if (config.timeSeriesDays != null) out.timeSeriesDays = config.timeSeriesDays;
  if (config.links?.length) out.links = config.links;
  return JSON.stringify(out);
}
