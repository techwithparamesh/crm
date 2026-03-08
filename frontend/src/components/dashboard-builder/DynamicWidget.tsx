"use client";

import { MetricCardWidget } from "./MetricCardWidget";
import { BarChartWidget } from "./BarChartWidget";
import { PieChartWidget } from "./PieChartWidget";
import { TimeSeriesWidget } from "./TimeSeriesWidget";
import { QuickLinksWidget } from "./QuickLinksWidget";
import { TableWidget } from "./TableWidget";
import type { WidgetConfig } from "./types";

export interface DynamicWidgetProps {
  widgetType: string;
  config: WidgetConfig;
  onEdit?: () => void;
  onDelete?: () => void;
  isEditing?: boolean;
}

export function DynamicWidget({ widgetType, config, onEdit, onDelete, isEditing }: DynamicWidgetProps) {
  const wrapper = (content: React.ReactNode) => (
    <div className="relative group">
      {content}
      {isEditing && (onEdit || onDelete) && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="rounded bg-background border px-2 py-1 text-xs shadow"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded bg-destructive text-destructive-foreground px-2 py-1 text-xs shadow"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );

  switch (widgetType) {
    case "metric_card":
      return wrapper(<MetricCardWidget config={config} />);
    case "bar_chart":
      return wrapper(<BarChartWidget config={config} />);
    case "pie_chart":
      return wrapper(<PieChartWidget config={config} />);
    case "table":
      return wrapper(<TableWidget config={config} />);
    case "time_series":
      return wrapper(<TimeSeriesWidget config={config} />);
    case "quick_links":
      return wrapper(<QuickLinksWidget config={config} />);
    default:
      return wrapper(
        <div className="rounded-lg border p-4 text-sm text-muted-foreground">
          Unknown widget type: {widgetType}
        </div>
      );
  }
}
