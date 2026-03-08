"use client";

import { useEffect, useState } from "react";
import { recordsApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { WidgetConfig } from "./types";

export interface TimeSeriesWidgetProps {
  config: WidgetConfig;
}

interface DayPoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g. "03-05"
  value: number;
}

function getDateRange(days: number): { dateFrom: string; dateTo: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - (days - 1));
  return {
    dateFrom: from.toISOString().slice(0, 10),
    dateTo: to.toISOString().slice(0, 10),
  };
}

export function TimeSeriesWidget({ config }: TimeSeriesWidgetProps) {
  const [data, setData] = useState<DayPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userId = useAuthStore((s) => s.user?.id);
  const days = config.timeSeriesDays ?? 7;

  useEffect(() => {
    if (!config.moduleId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { dateFrom, dateTo } = getDateRange(days);
    recordsApi
      .list(config.moduleId, {
        limit: 500,
        stageId: config.filters?.stageId,
        ...(config.scopeOwn && userId ? { createdBy: userId } : {}),
        dateFrom,
        dateTo,
      })
      .then((res) => {
        const byDay: Record<string, number> = {};
        const start = new Date(dateFrom + "T00:00:00.000Z");
        const end = new Date(dateTo + "T23:59:59.999Z");
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().slice(0, 10);
          byDay[key] = 0;
        }
        for (const r of res.items) {
          const created = (r as { createdAt?: string }).createdAt;
          if (!created) continue;
          const key = new Date(created).toISOString().slice(0, 10);
          if (key in byDay) byDay[key]++;
        }
        setData(
          Object.entries(byDay)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date]) => ({
              date,
              label: date.slice(5).replace("-", "/"),
              value: byDay[date],
            }))
        );
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [config.moduleId, config.filters?.stageId, config.scopeOwn, config.timeSeriesDays, userId, days]);

  if (!config.moduleId) return <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Select a module.</p></CardContent></Card>;
  if (error) return <Card><CardContent className="pt-6"><p className="text-sm text-destructive">{error}</p></CardContent></Card>;

  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <Card>
      {config.title && <CardHeader className="pb-2"><p className="text-sm font-medium text-muted-foreground">{config.title}</p></CardHeader>}
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data in range.</p>
        ) : (
          <div className="space-y-2">
            {data.map((d) => (
              <div key={d.date} className="flex items-center gap-2">
                <span className="w-12 text-sm text-muted-foreground">{d.label}</span>
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary rounded min-w-[2px]"
                    style={{ width: `${(d.value / maxVal) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-6 text-right">{d.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
