"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Field } from "@/lib/api";
import type { WidgetConfig, WidgetType } from "./types";
import { WIDGET_TYPES } from "./types";

function QuickLinksEditor({ links, onChange }: { links: { label: string; url: string }[]; onChange: (links: { label: string; url: string }[]) => void }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const add = () => {
    if (label.trim() && url.trim()) {
      onChange([...links, { label: label.trim(), url: url.trim() }]);
      setLabel("");
      setUrl("");
    }
  };
  const remove = (i: number) => onChange(links.filter((_, j) => j !== i));
  return (
    <div className="space-y-2">
      <Label>Links</Label>
      <ul className="text-sm space-y-1">
        {links.map((link, i) => (
          <li key={i} className="flex items-center justify-between gap-2 rounded border px-2 py-1">
            <span className="truncate">{link.label} → {link.url}</span>
            <Button type="button" variant="ghost" size="sm" className="shrink-0 h-7" onClick={() => remove(i)}>Remove</Button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label"
          className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="URL or path (e.g. /records/...)"
          className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm"
        />
        <Button type="button" size="sm" onClick={add}>Add</Button>
      </div>
    </div>
  );
}

export interface WidgetConfigFormProps {
  widgetType: WidgetType;
  config: WidgetConfig;
  modules: { id: string; name: string }[];
  fields: Field[];
  stages: { id: string; stageName: string }[];
  onChange: (config: WidgetConfig) => void;
  onWidgetTypeChange?: (type: WidgetType) => void;
}

export function WidgetConfigForm({
  widgetType,
  config,
  modules,
  fields,
  stages,
  onChange,
  onWidgetTypeChange,
}: WidgetConfigFormProps) {
  const update = (patch: Partial<WidgetConfig>) =>
    onChange({ ...config, ...patch });

  return (
    <div className="space-y-4">
      {onWidgetTypeChange && (
        <div>
          <Label>Chart / widget type</Label>
          <select
            value={widgetType}
            onChange={(e) => onWidgetTypeChange(e.target.value as WidgetType)}
            className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
          >
            {WIDGET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      )}

      {widgetType !== "quick_links" && (
        <div>
          <Label>Data source (module)</Label>
          <select
            value={config.moduleId}
            onChange={(e) => update({ moduleId: e.target.value })}
            className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select module</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <Label>Title (optional)</Label>
        <input
          type="text"
          value={config.title ?? ""}
          onChange={(e) => update({ title: e.target.value || undefined })}
          className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
          placeholder="Widget title"
        />
      </div>

      {widgetType !== "quick_links" && (
        <>
          <div>
            <Label>Filter by stage (optional)</Label>
            <select
              value={config.filters?.stageId ?? ""}
              onChange={(e) =>
                update({
                  filters: e.target.value ? { stageId: e.target.value } : undefined,
                })
              }
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">All stages</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>{s.stageName}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.scopeOwn ?? false}
              onChange={(e) => update({ scopeOwn: e.target.checked || undefined })}
            />
            <span className="text-sm">Limit to my records (e.g. &quot;My leads&quot;)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Date from (YYYY-MM-DD)</Label>
              <input
                type="date"
                value={config.dateFrom ?? ""}
                onChange={(e) => update({ dateFrom: e.target.value || undefined })}
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Date to (YYYY-MM-DD)</Label>
              <input
                type="date"
                value={config.dateTo ?? ""}
                onChange={(e) => update({ dateTo: e.target.value || undefined })}
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </>
      )}

      {widgetType === "time_series" && (
        <div>
          <Label>Number of days</Label>
          <input
            type="number"
            min={1}
            max={90}
            value={config.timeSeriesDays ?? 7}
            onChange={(e) => update({ timeSeriesDays: parseInt(e.target.value, 10) || 7 })}
            className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">Show daily count for the last N days.</p>
        </div>
      )}

      {widgetType === "quick_links" && (
        <QuickLinksEditor links={config.links ?? []} onChange={(links) => update({ links })} />
      )}

      {widgetType === "metric_card" && (
        <>
          <div>
            <Label>Metric type</Label>
            <select
              value={config.metricType ?? "count"}
              onChange={(e) =>
                update({
                  metricType: e.target.value as "count" | "sum" | "average",
                })
              }
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="count">Count records</option>
              <option value="sum">Sum field</option>
              <option value="average">Average field</option>
            </select>
          </div>
          {(config.metricType === "sum" || config.metricType === "average") && (
            <div>
              <Label>Value field (number)</Label>
              <select
                value={config.valueField ?? ""}
                onChange={(e) => update({ valueField: e.target.value || undefined })}
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select field</option>
                {fields.filter((f) => f.fieldType === "number" || f.fieldType === "currency").map((f) => (
                  <option key={f.id} value={f.fieldKey}>{f.label}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {(widgetType === "bar_chart" || widgetType === "pie_chart") && (
        <>
          <div>
            <Label>Category field (group by)</Label>
            <select
              value={config.categoryField ?? ""}
              onChange={(e) => update({ categoryField: e.target.value || undefined })}
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select field</option>
              {fields.map((f) => (
                <option key={f.id} value={f.fieldKey}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Value</Label>
            <select
              value={config.valueAgg ?? "count"}
              onChange={(e) => update({ valueAgg: e.target.value as "count" | "sum" })}
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="count">Count</option>
              <option value="sum">Sum of field</option>
            </select>
          </div>
          {config.valueAgg === "sum" && (
            <div>
              <Label>Value field (number)</Label>
              <select
                value={config.valueField ?? ""}
                onChange={(e) => update({ valueField: e.target.value || undefined })}
                className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select field</option>
                {fields.filter((f) => f.fieldType === "number" || f.fieldType === "currency").map((f) => (
                  <option key={f.id} value={f.fieldKey}>{f.label}</option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      {widgetType === "table" && (
        <>
          <div>
            <Label>Columns (field keys, comma-separated or select)</Label>
            <input
              type="text"
              value={config.columns?.join(", ") ?? ""}
              onChange={(e) =>
                update({
                  columns: e.target.value
                    ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                    : undefined,
                })
              }
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
              placeholder="name, email, status"
            />
            <p className="text-xs text-muted-foreground mt-1">Leave empty to show all fields.</p>
          </div>
          <div>
            <Label>Row limit</Label>
            <input
              type="number"
              min={1}
              max={500}
              value={config.limit ?? 10}
              onChange={(e) => update({ limit: parseInt(e.target.value, 10) || 10 })}
              className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </>
      )}
    </div>
  );
}
