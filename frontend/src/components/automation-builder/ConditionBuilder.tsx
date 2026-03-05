"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Field } from "@/lib/api";
import type { AutomationCondition } from "./types";
import { CONDITION_OPERATORS } from "./types";
import { Filter, Plus, Trash2 } from "lucide-react";

export interface ConditionBuilderProps {
  conditions: AutomationCondition[];
  fields: Field[];
  onChange: (conditions: AutomationCondition[]) => void;
  disabled?: boolean;
}

export function ConditionBuilder({
  conditions,
  fields,
  onChange,
  disabled,
}: ConditionBuilderProps) {
  const addCondition = () => {
    onChange([...conditions, { operator: "eq", value: "" }]);
  };

  const updateCondition = (index: number, patch: Partial<AutomationCondition>) => {
    const next = [...conditions];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const needsValue = (op: string) =>
    op !== "is_empty" && op !== "is_not_empty";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Conditions (all must match)
        </CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addCondition} disabled={disabled}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {conditions.length === 0 && (
          <p className="text-sm text-muted-foreground">No conditions — workflow runs for every trigger.</p>
        )}
        {conditions.map((c, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2 p-3 rounded-lg border bg-muted/30">
            <div className="flex-1 min-w-[120px]">
              <label className="text-xs text-muted-foreground block mb-1">Field</label>
              <select
                value={c.field ?? ""}
                onChange={(e) => updateCondition(i, { field: e.target.value || undefined })}
                className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                disabled={disabled}
              >
                <option value="">—</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.fieldKey}>{f.label}</option>
                ))}
              </select>
            </div>
            <div className="w-[140px]">
              <label className="text-xs text-muted-foreground block mb-1">Operator</label>
              <select
                value={c.operator}
                onChange={(e) => updateCondition(i, { operator: e.target.value })}
                className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                disabled={disabled}
              >
                {CONDITION_OPERATORS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {needsValue(c.operator) && (
              <div className="flex-1 min-w-[120px]">
                <label className="text-xs text-muted-foreground block mb-1">Value</label>
                <input
                  type="text"
                  value={typeof c.value === "string" ? c.value : String(c.value ?? "")}
                  onChange={(e) => updateCondition(i, { value: e.target.value })}
                  className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                  disabled={disabled}
                  placeholder="Value"
                />
              </div>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={() => removeCondition(i)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
