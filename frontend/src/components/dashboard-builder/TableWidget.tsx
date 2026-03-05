"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { recordsApi } from "@/lib/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { WidgetConfig } from "./types";
import type { RecordListItem } from "@/lib/api";

export interface TableWidgetProps {
  config: WidgetConfig;
  moduleId?: string;
}

export function TableWidget({ config, moduleId: _moduleId }: TableWidgetProps) {
  const [items, setItems] = useState<RecordListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!config.moduleId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    recordsApi
      .list(config.moduleId, {
        limit: config.limit ?? 10,
        stageId: config.filters?.stageId,
      })
      .then((res) => setItems(res.items))
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [config.moduleId, config.limit, config.filters?.stageId]);

  if (!config.moduleId) return <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Select a module.</p></CardContent></Card>;
  if (error) return <Card><CardContent className="pt-6"><p className="text-sm text-destructive">{error}</p></CardContent></Card>;

  const columns = config.columns?.length ? config.columns : Object.keys(items[0]?.values ?? {});

  return (
    <Card>
      {config.title && <CardHeader className="pb-2"><p className="text-sm font-medium text-muted-foreground">{config.title}</p></CardHeader>}
      <CardContent className="p-0">
        {loading ? (
          <p className="p-4 text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No records</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  {columns.map((key) => (
                    <th key={key} className="text-left px-3 py-2 font-medium">{key}</th>
                  ))}
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-muted/30">
                    {columns.map((key) => (
                      <td key={key} className="px-3 py-2">
                        {r.values[key] != null ? String(r.values[key]) : "—"}
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <Link href={`/record/${r.id}`} className="text-primary hover:underline text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
