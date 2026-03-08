"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { modulesApi } from "@/lib/api";
import type { Field } from "@/lib/api";
import type { AutomationAction, CreateRecordFieldMapping } from "./types";
import { ACTION_OPTIONS } from "./types";
import { Play, Plus, Trash2 } from "lucide-react";

function CreateRecordActionParams({
  action,
  index,
  fields,
  modules,
  moduleId,
  disabled,
  updateActionParams,
}: {
  action: AutomationAction;
  index: number;
  fields: Field[];
  modules: { id: string; name: string }[];
  moduleId?: string | null;
  disabled?: boolean;
  updateActionParams: (index: number, key: string, value: unknown) => void;
}) {
  const targetModuleId = (action.params?.targetModuleId as string) ?? "";
  const fieldMapping = (action.params?.fieldMapping ?? []) as CreateRecordFieldMapping[];
  const setOnCurrentRecord = action.params?.setOnCurrentRecord as { fieldKey: string } | undefined;
  const [targetFields, setTargetFields] = useState<Field[]>([]);

  useEffect(() => {
    if (!targetModuleId) {
      setTargetFields([]);
      return;
    }
    modulesApi.get(targetModuleId).then((m) => setTargetFields(m.fields ?? [])).catch(() => setTargetFields([]));
  }, [targetModuleId]);

  const relationFields = fields.filter((f) => f.fieldType === "relation");

  const updateMapping = (newMapping: CreateRecordFieldMapping[]) => {
    updateActionParams(index, "fieldMapping", newMapping);
  };

  const addMapping = () => {
    updateMapping([...fieldMapping, { targetFieldKey: "", sourceType: "field", sourceFieldKey: fields[0]?.fieldKey }]);
  };

  const setMapping = (idx: number, patch: Partial<CreateRecordFieldMapping>) => {
    const next = [...fieldMapping];
    next[idx] = { ...next[idx], ...patch };
    updateMapping(next);
  };

  const removeMapping = (idx: number) => {
    updateMapping(fieldMapping.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-muted-foreground block mb-1">Target module</label>
        <select
          value={targetModuleId}
          onChange={(e) => updateActionParams(index, "targetModuleId", e.target.value || undefined)}
          className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
          disabled={disabled}
        >
          <option value="">Select module...</option>
          {modules
            .filter((m) => m.id !== moduleId)
            .map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">Create a new record in this module using current record values.</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-muted-foreground">Field mapping</label>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={addMapping} disabled={disabled || !targetModuleId}>
            <Plus className="h-3 w-3 mr-1" /> Add row
          </Button>
        </div>
        {fieldMapping.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">Add rows to copy field values from the current record to the new record.</p>
        )}
        {fieldMapping.map((row, idx) => (
          <div key={idx} className="flex flex-wrap items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
            <select
              value={row.targetFieldKey}
              onChange={(e) => setMapping(idx, { targetFieldKey: e.target.value })}
              className="rounded border border-input bg-background px-2 py-1 text-sm min-w-[120px]"
              disabled={disabled}
              title="Target field (on new record)"
            >
              <option value="">Target field</option>
              {targetFields.map((f) => (
                <option key={f.id} value={f.fieldKey}>{f.label}</option>
              ))}
            </select>
            <span className="text-muted-foreground text-xs">←</span>
            <select
              value={row.sourceType}
              onChange={(e) => setMapping(idx, { sourceType: e.target.value as "field" | "literal" })}
              className="rounded border border-input bg-background px-2 py-1 text-sm w-20"
              disabled={disabled}
            >
              <option value="field">Field</option>
              <option value="literal">Literal</option>
            </select>
            {row.sourceType === "field" ? (
              <select
                value={row.sourceFieldKey ?? ""}
                onChange={(e) => setMapping(idx, { sourceFieldKey: e.target.value || undefined })}
                className="rounded border border-input bg-background px-2 py-1 text-sm min-w-[120px]"
                disabled={disabled}
                title="Source field (current record)"
              >
                <option value="">Source field</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.fieldKey}>{f.label}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={String(row.literalValue ?? "")}
                onChange={(e) => setMapping(idx, { literalValue: e.target.value })}
                className="rounded border border-input bg-background px-2 py-1 text-sm min-w-[100px]"
                placeholder="Value"
                disabled={disabled}
              />
            )}
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeMapping(idx)} disabled={disabled}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>

      {relationFields.length > 0 && (
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Link new record to current record (optional)</label>
          <select
            value={setOnCurrentRecord?.fieldKey ?? ""}
            onChange={(e) =>
              updateActionParams(index, "setOnCurrentRecord", e.target.value ? { fieldKey: e.target.value } : undefined)
            }
            className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
            disabled={disabled}
          >
            <option value="">Do not link</option>
            {relationFields.map((f) => (
              <option key={f.id} value={f.fieldKey}>{f.label} (relation)</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">Set this relation field on the current record to the newly created record.</p>
        </div>
      )}
    </div>
  );
}

export interface ActionBuilderProps {
  actions: AutomationAction[];
  fields: Field[];
  onChange: (actions: AutomationAction[]) => void;
  disabled?: boolean;
  /** For create_record: list of modules (target module dropdown). Exclude current module if moduleId provided. */
  modules?: { id: string; name: string }[];
  /** Current module id (so we can exclude it from target list and show relation fields for setOnCurrentRecord) */
  moduleId?: string | null;
}

export function ActionBuilder({
  actions,
  fields,
  onChange,
  disabled,
  modules = [],
  moduleId,
}: ActionBuilderProps) {
  const addAction = () => {
    onChange([...actions, { type: "create_task", params: {} }]);
  };

  const updateAction = (index: number, patch: Partial<AutomationAction>) => {
    const next = [...actions];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const updateActionParams = (index: number, key: string, value: unknown) => {
    const next = [...actions];
    const params = { ...(next[index].params ?? {}), [key]: value };
    next[index] = { ...next[index], params };
    onChange(next);
  };

  const removeAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Play className="h-4 w-4" />
          Actions
        </CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addAction} disabled={disabled}>
          <Plus className="h-4 w-4 mr-1" />
          Add action
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {actions.length === 0 && (
          <p className="text-sm text-muted-foreground">Add at least one action.</p>
        )}
        {actions.map((action, i) => (
          <div key={i} className="rounded-lg border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <select
                value={action.type}
                onChange={(e) =>
                  updateAction(i, {
                    type: e.target.value as AutomationAction["type"],
                    params: {},
                  })
                }
                className="rounded border border-input bg-background px-3 py-2 text-sm font-medium"
                disabled={disabled}
              >
                {ACTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8"
                onClick={() => removeAction(i)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            {action.type === "create_task" && (
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Title</label>
                  <input
                    type="text"
                    value={String((action.params?.title as string) ?? "")}
                    onChange={(e) => updateActionParams(i, "title", e.target.value)}
                    className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    placeholder="Task title"
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Description</label>
                  <input
                    type="text"
                    value={String((action.params?.description as string) ?? "")}
                    onChange={(e) => updateActionParams(i, "description", e.target.value)}
                    className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    placeholder="Optional"
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Due date (optional)</label>
                  <input
                    type="date"
                    value={
                      action.params?.dueDate
                        ? new Date(String(action.params.dueDate)).toISOString().slice(0, 10)
                        : ""
                    }
                    onChange={(e) =>
                      updateActionParams(i, "dueDate", e.target.value ? e.target.value : undefined)
                    }
                    className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    disabled={disabled}
                  />
                </div>
              </div>
            )}

            {action.type === "send_email" && (
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">To</label>
                  <input
                    type="text"
                    value={String((action.params?.to as string) ?? "")}
                    onChange={(e) => updateActionParams(i, "to", e.target.value)}
                    className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    placeholder="email@example.com"
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Subject</label>
                  <input
                    type="text"
                    value={String((action.params?.subject as string) ?? "")}
                    onChange={(e) => updateActionParams(i, "subject", e.target.value)}
                    className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    placeholder="Email subject"
                    disabled={disabled}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground block mb-1">Body (optional)</label>
                  <textarea
                    value={String((action.params?.body as string) ?? "")}
                    onChange={(e) => updateActionParams(i, "body", e.target.value)}
                    className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm min-h-[80px]"
                    placeholder="Email body"
                    disabled={disabled}
                  />
                </div>
              </div>
            )}

            {action.type === "update_field" && (
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Field</label>
                  <select
                    value={String((action.params?.fieldKey as string) ?? "")}
                    onChange={(e) => updateActionParams(i, "fieldKey", e.target.value || undefined)}
                    className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    disabled={disabled}
                  >
                    <option value="">Select field</option>
                    {fields.map((f) => (
                      <option key={f.id} value={f.fieldKey}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Value</label>
                  <input
                    type="text"
                    value={String((action.params?.value as string) ?? "")}
                    onChange={(e) => updateActionParams(i, "value", e.target.value)}
                    className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    placeholder="New value"
                    disabled={disabled}
                  />
                </div>
              </div>
            )}

            {action.type === "send_webhook" && (
              <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs text-muted-foreground block mb-1">URL</label>
                  <input
                    type="url"
                    value={String((action.params?.url as string) ?? "")}
                    onChange={(e) => updateActionParams(i, "url", e.target.value)}
                    className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    placeholder="https://..."
                    disabled={disabled}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Method</label>
                  <select
                    value={String((action.params?.method as string) ?? "POST")}
                    onChange={(e) => updateActionParams(i, "method", e.target.value)}
                    className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm"
                    disabled={disabled}
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
              </div>
            )}

            {action.type === "create_record" && (
              <CreateRecordActionParams
                action={action}
                index={i}
                fields={fields}
                modules={modules}
                moduleId={moduleId}
                disabled={disabled}
                updateActionParams={updateActionParams}
              />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
