"use client";

import type { FormFieldConfig } from "@/lib/api";

export interface FormPreviewProps {
  formName: string;
  fields: FormFieldConfig[];
}

export function FormPreview({ formName, fields }: FormPreviewProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Preview</h3>
      <div className="bg-background rounded-md border p-4 shadow-sm max-w-md">
        <h4 className="font-semibold mb-4">{formName || "Form"}</h4>
        {fields.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add fields to see preview.</p>
        ) : (
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.fieldKey}>
                <label className="text-sm font-medium block mb-1">
                  {f.label || f.fieldKey}
                  {f.required && " *"}
                </label>
                {f.type === "textarea" ? (
                  <div className="h-20 rounded border border-input bg-muted/30" />
                ) : (
                  <div
                    className="h-9 rounded border border-input bg-muted/30"
                    style={{ width: "100%" }}
                  />
                )}
              </div>
            ))}
            <button
              type="button"
              className="mt-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
            >
              Submit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
