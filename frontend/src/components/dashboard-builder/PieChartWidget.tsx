"use client";

import { useEffect, useState } from "react";
import { recordsApi } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { WidgetConfig } from "./types";

export interface PieChartWidgetProps {
  config: WidgetConfig;
}

interface SliceItem {
  label: string;
  value: number;
  color: string;
}

const PIE_COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export function PieChartWidget({ config }: PieChartWidgetProps) {
  const [data, setData] = useState<SliceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config.moduleId || !config.categoryField) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    recordsApi
      .list(config.moduleId, { limit: 500, stageId: config.filters?.stageId })
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
        const arr = Object.entries(agg).map(([label, value]) => ({ label, value }));
        arr.sort((a, b) => b.value - a.value);
        const total = arr.reduce((s, x) => s + x.value, 0);
        setData(
          arr.slice(0, 8).map((d, i) => ({
            ...d,
            color: PIE_COLORS[i % PIE_COLORS.length],
          }))
        );
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [config.moduleId, config.categoryField, config.valueAgg, config.valueField, config.filters?.stageId]);

  if (!config.moduleId) return <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Select module and category field.</p></CardContent></Card>;
  if (!config.categoryField) return <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Select category field.</p></CardContent></Card>;
  if (error) return <Card><CardContent className="pt-6"><p className="text-sm text-destructive">{error}</p></CardContent></Card>;

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      {config.title && <CardHeader className="pb-2"><p className="text-sm font-medium text-muted-foreground">{config.title}</p></CardHeader>}
      <CardContent className="flex gap-4 items-start">
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data</p>
        ) : (
          <>
            <div
              className="w-24 h-24 rounded-full shrink-0"
              style={{
                background: `conic-gradient(${data
                  .map((d, i) => {
                    const start = data.slice(0, i).reduce((s, x) => s + (x.value / total) * 360, 0);
                    const deg = (d.value / total) * 360;
                    return `${d.color} ${start}deg ${start + deg}deg`;
                  })
                  .join(", ")})`,
              }}
            />
            <ul className="text-xs space-y-1 flex-1 min-w-0">
              {data.map((d) => (
                <li key={d.label} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="truncate">{d.label}</span>
                  <span className="font-medium">{d.value}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
