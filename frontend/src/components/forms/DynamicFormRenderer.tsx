"use client";

import * as React from "react";
import { FormProvider, useForm } from "react-hook-form";
import { DynamicField } from "./DynamicField";
import { buildDefaultValues } from "./field-config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Field } from "@/lib/api";

export type DynamicFormLayout = "stack" | "grid" | "grid-2";

export interface DynamicFormRendererProps {
  /** Field definitions from module metadata */
  fields: Field[];
  /** Initial values (keyed by fieldKey). If not provided, defaults from field config are used. */
  defaultValues?: Record<string, unknown>;
  /** Submit handler; receives validated values keyed by fieldKey */
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  /** Label for the submit button */
  submitLabel?: string;
  /** Layout: stack (single column), grid (responsive 1–2 cols), grid-2 (always 2 cols) */
  layout?: DynamicFormLayout;
  /** Disable submit while loading (e.g. API in flight) */
  isSubmitting?: boolean;
  /** Optional class for the form element */
  className?: string;
  /** Optional content after fields, before submit (e.g. pipeline stage selector) */
  children?: React.ReactNode;
  /** Optional footer (e.g. Cancel link). Rendered after submit button. */
  footer?: React.ReactNode;
  /** When true, inputs are disabled and submit button is hidden */
  readOnly?: boolean;
}

export function DynamicFormRenderer({
  fields,
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  layout = "stack",
  isSubmitting = false,
  className,
  children,
  footer,
  readOnly = false,
}: DynamicFormRendererProps) {
  const values = defaultValues ?? buildDefaultValues(fields);
  const form = useForm({
    defaultValues: values,
    values: undefined, // uncontrolled; use defaultValues only on mount
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data);
  });

  const layoutClass =
    layout === "grid"
      ? "grid grid-cols-1 md:grid-cols-2 gap-4"
      : layout === "grid-2"
        ? "grid grid-cols-2 gap-4"
        : "flex flex-col gap-4";

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit} className={cn("space-y-6", className)} noValidate>
        <div className={layoutClass}>
          {fields.map((field) => (
            <DynamicField
              key={field.id}
              field={field}
              fullWidth={field.fieldType === "textarea" || field.fieldType === "multi_select"}
              disabled={readOnly}
            />
          ))}
        </div>
        {children}
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
            {footer}
          </div>
        )}
        {readOnly && footer}
      </form>
    </FormProvider>
  );
}
