"use client";

import { useEffect, useState } from "react";
import { recordsApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { WidgetConfig } from "./types";

export interface MetricCardWidgetProps {
  config: WidgetConfig;
}

export function MetricCardWidget({ config }: MetricCardWidgetProps) {
  const [value, setValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!config.moduleId) {
      setValue(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const filters = config.filters ?? {};
    const useCurrentUser = config.scopeOwn || filters.ownerId === "CURRENT_USER";
    let dateFrom = config.dateFrom;
    let dateTo = config.dateTo;
    if (filters.date === "THIS_MONTH" || config.dateRange === "THIS_MONTH") {
      const now = new Date();
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    }
    recordsApi
      .list(config.moduleId, {
        limit: 500,
        stageId: config.filters?.stageId,
        ...(useCurrentUser && userId ? { ownerId: userId } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
      })
      .then((res) => {
        const items = res.items;
        const type = config.metricType ?? "count";
        if (type === "count") {
          setValue(res.total);
          return;
        }
        const field = config.valueField;
        if (!field) {
          setValue(items.length);
          return;
        }
        const nums = items
          .map((r) => r.values[field])
          .filter((v) => v !== undefined && v !== null && v !== "")
          .map((v) => Number(v));
        if (type === "sum") setValue(nums.reduce((a, b) => a + b, 0));
        else if (type === "average") setValue(nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0);
        else setValue(res.total);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [config.moduleId, config.filters, config.metricType, config.valueField, config.scopeOwn, config.dateFrom, config.dateTo, config.dateRange, userId]);

  if (!config.moduleId) return <Card className="border-dashed"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Configure this widget: choose a module and metric type in the widget settings.</p></CardContent></Card>;
  if (error) return <Card><CardContent className="pt-6"><p className="text-sm text-destructive">{error}</p></CardContent></Card>;

  return (
    <Card>
      {config.title && <CardHeader className="pb-2"><p className="text-sm font-medium text-muted-foreground">{config.title}</p></CardHeader>}
      <CardContent>
        <p className="text-2xl font-bold">{loading ? "…" : value != null ? (config.metricType === "average" ? value.toFixed(1) : value) : "—"}</p>
      </CardContent>
    </Card>
  );
}
