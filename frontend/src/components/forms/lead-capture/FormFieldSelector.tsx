"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Field } from "@/lib/api";
import type { FormFieldConfig } from "@/lib/api";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";

export interface FormFieldSelectorProps {
  /** Module fields to choose from */
  availableFields: Field[];
  /** Currently selected form fields (order preserved) */
  selected: FormFieldConfig[];
  onChange: (fields: FormFieldConfig[]) => void;
}

export function FormFieldSelector({ availableFields, selected, onChange }: FormFieldSelectorProps) {
  const selectedKeys = new Set(selected.map((f) => f.fieldKey));

  const addField = (field: Field) => {
    if (selectedKeys.has(field.fieldKey)) return;
    onChange([
      ...selected,
      {
        fieldKey: field.fieldKey,
        type: field.fieldType,
        required: field.isRequired,
        label: field.label,
        placeholder: "",
      },
    ]);
  };

  const removeField = (fieldKey: string) => {
    onChange(selected.filter((f) => f.fieldKey !== fieldKey));
  };

  const updateField = (fieldKey: string, patch: Partial<FormFieldConfig>) => {
    onChange(
      selected.map((f) =>
        f.fieldKey === fieldKey ? { ...f, ...patch } : f
      )
    );
  };

  const move = (index: number, dir: number) => {
    const next = index + dir;
    if (next < 0 || next >= selected.length) return;
    const arr = [...selected];
    [arr[index], arr[next]] = [arr[next], arr[index]];
    onChange(arr);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium">Form fields</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Add fields from the module and set order. Drag to reorder (use arrows).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">Available</Label>
          <ul className="mt-2 border rounded-md divide-y max-h-48 overflow-y-auto">
            {availableFields.length === 0 && (
              <li className="px-3 py-4 text-sm text-muted-foreground">
                No fields in this module. Add fields under <strong>Modules → [your module] → Fields</strong> first, then return here.
              </li>
            )}
            {availableFields.length > 0 &&
              availableFields
                .filter((f) => !selectedKeys.has(f.fieldKey))
                .map((f) => (
                  <li key={f.id} className="px-3 py-2 flex items-center justify-between">
                    <span className="text-sm">{f.label}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addField(f)}
                    >
                      Add
                    </Button>
                  </li>
                ))}
            {availableFields.length > 0 && availableFields.filter((f) => !selectedKeys.has(f.fieldKey)).length === 0 && (
              <li className="px-3 py-4 text-sm text-muted-foreground">All fields added</li>
            )}
          </ul>
        </div>

        <div>
          <Label className="text-xs text-muted-foreground">Selected (form order)</Label>
          <ul className="mt-2 space-y-2">
            {selected.map((f, i) => (
              <li
                key={f.fieldKey}
                className="border rounded-md p-3 flex items-start gap-2"
              >
                <div className="flex flex-col gap-0 shrink-0 mt-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                    aria-label="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === selected.length - 1}
                    className="p-0.5 rounded hover:bg-muted disabled:opacity-30"
                    aria-label="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Label"
                      value={f.label ?? f.fieldKey}
                      onChange={(e) => updateField(f.fieldKey, { label: e.target.value })}
                      className="h-8"
                    />
                    <Checkbox
                      checked={f.required ?? false}
                      onCheckedChange={(c) => updateField(f.fieldKey, { required: !!c })}
                    />
                    <Label className="text-xs whitespace-nowrap">Required</Label>
                  </div>
                  <Input
                    placeholder="Placeholder"
                    value={f.placeholder ?? ""}
                    onChange={(e) => updateField(f.fieldKey, { placeholder: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-destructive hover:text-destructive"
                  onClick={() => removeField(f.fieldKey)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
            {selected.length === 0 && (
              <li className="border rounded-md px-3 py-6 text-sm text-muted-foreground text-center">
                No fields selected. Add from the left.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
