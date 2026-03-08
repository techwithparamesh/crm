"use client";

import { useEffect, useState } from "react";
import { recordsApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { WidgetConfig } from "./types";

export interface BarChartWidgetProps {
  config: WidgetConfig;
}

interface BarItem {
  label: string;
  value: number;
}

export function BarChartWidget({ config }: BarChartWidgetProps) {
  const [data, setData] = useState<BarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (!config.moduleId || !config.categoryField) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    recordsApi
      .list(config.moduleId, {
        limit: 500,
        stageId: config.filters?.stageId,
        ...(config.scopeOwn && userId ? { createdBy: userId } : {}),
        ...(config.dateFrom ? { dateFrom: config.dateFrom } : {}),
        ...(config.dateTo ? { dateTo: config.dateTo } : {}),
      })
      .then((res) => {
        const agg: Record<string, number> = {};
        const catField = config.categoryField!;
        const valueAgg = config.valueAgg ?? "count";
        const valueField = config.valueField;

        for (const r of res.items) {
          const cat = String(r.values[catField] ?? "—");
          if (valueAgg === "count") {
            agg[cat] = (agg[cat] ?? 0) + 1;
          } else {
            const v = valueField ? Number(r.values[valueField]) : NaN;
            if (!Number.isNaN(v)) agg[cat] = (agg[cat] ?? 0) + v;
          }
        }
        setData(
          Object.entries(agg).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
        );
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [config.moduleId, config.categoryField, config.valueAgg, config.valueField, config.filters?.stageId, config.scopeOwn, config.dateFrom, config.dateTo, userId]);

  if (!config.moduleId) return <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Select module and category field.</p></CardContent></Card>;
  if (!config.categoryField) return <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Select category field.</p></CardContent></Card>;
  if (error) return <Card><CardContent className="pt-6"><p className="text-sm text-destructive">{error}</p></CardContent></Card>;

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card>
      {config.title && <CardHeader className="pb-2"><p className="text-sm font-medium text-muted-foreground">{config.title}</p></CardHeader>}
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data</p>
        ) : (
          <div className="space-y-2">
            {data.slice(0, 12).map((d) => (
              <div key={d.label} className="flex items-center gap-2">
                <span className="w-24 truncate text-sm">{d.label}</span>
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary rounded min-w-[2px]"
                    style={{ width: `${(d.value / maxVal) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">{d.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
