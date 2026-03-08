"use client";

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Field } from "@/lib/api";
import { recordsApi, usersApi } from "@/lib/api";
import { parseOptions } from "./field-config";

export { buildDefaultValues } from "./field-config";

const inputBase =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export interface DynamicFieldProps {
  field: Field;
  className?: string;
  /** Optional override for layout (e.g. full width in grid) */
  fullWidth?: boolean;
  disabled?: boolean;
}

export function DynamicField({ field, className, fullWidth, disabled }: DynamicFieldProps) {
  const { register, setValue, watch, formState: { errors } } = useFormContext();
  const name = field.fieldKey;
  const options = parseOptions(field.optionsJSON);
  const value = watch(name);
  const error = errors[name];

  const wrapperClass = cn("space-y-2", fullWidth && "col-span-full", className);

  switch (field.fieldType) {
    case "textarea":
      return (
        <div className={wrapperClass}>
          <Label htmlFor={name} required={field.isRequired}>
            {field.label}
          </Label>
          <textarea
            id={name}
            {...register(name, { required: field.isRequired ? `${field.label} is required` : false })}
            className={cn(inputBase, "min-h-[80px] py-2")}
            placeholder={field.label}
            rows={4}
            disabled={disabled}
          />
          {error && <p className="text-xs text-destructive">{String(error.message)}</p>}
        </div>
      );

    case "dropdown":
      return (
        <div className={wrapperClass}>
          <Label htmlFor={name} required={field.isRequired}>
            {field.label}
          </Label>
          <select
            id={name}
            {...register(name, { required: field.isRequired ? `${field.label} is required` : false })}
            className={cn(inputBase, "cursor-pointer")}
            disabled={disabled}
          >
            <option value="">Select...</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {error && <p className="text-xs text-destructive">{String(error.message)}</p>}
        </div>
      );

    case "multi_select": {
      const multiVal = Array.isArray(value) ? value : [];
      return (
        <div className={wrapperClass}>
          <Label required={field.isRequired}>{field.label}</Label>
          <div className="flex flex-wrap gap-3" role="group" aria-label={field.label}>
            {options.map((opt) => (
              <label
                key={opt}
                className={cn(
                  "flex items-center gap-2 text-sm cursor-pointer rounded-md border border-input px-3 py-2 hover:bg-muted/50",
                  multiVal.includes(opt) && "border-primary bg-primary/5"
                )}
              >
                <input
                  type="checkbox"
                  checked={multiVal.includes(opt)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...multiVal, opt]
                      : multiVal.filter((v) => v !== opt);
                    setValue(name, next, { shouldValidate: true });
                  }}
                  className="h-4 w-4 rounded border-input"
                  disabled={disabled}
                />
                {opt}
              </label>
            ))}
          </div>
          {error && <p className="text-xs text-destructive">{String(error.message)}</p>}
        </div>
      );
    }

    case "checkbox":
    case "boolean":
      return (
        <div className={cn(wrapperClass, "flex flex-row items-center gap-2")}>
          <input
            id={name}
            type="checkbox"
            {...register(name)}
            className="h-4 w-4 rounded border-input"
            disabled={disabled}
          />
          <Label htmlFor={name} className="cursor-pointer font-normal">
            {field.label}
          </Label>
          {error && <p className="text-xs text-destructive">{String(error.message)}</p>}
        </div>
      );

    case "number":
    case "currency":
      return (
        <div className={wrapperClass}>
          <Label htmlFor={name} required={field.isRequired}>
            {field.label}
            {field.fieldType === "currency" && " (e.g. 0.00)"}
          </Label>
          <Input
            id={name}
            type="number"
            step={field.fieldType === "currency" ? 0.01 : undefined}
            disabled={disabled}
            {...register(name, {
              required: field.isRequired ? `${field.label} is required` : false,
              setValueAs: (v) => (v === "" || v === undefined ? undefined : Number(v)),
            })}
          />
          {error && <p className="text-xs text-destructive">{String(error.message)}</p>}
        </div>
      );

    case "date":
      return (
        <div className={wrapperClass}>
          <Label htmlFor={name} required={field.isRequired}>
            {field.label}
          </Label>
          <Input
            id={name}
            type="date"
            disabled={disabled}
            {...register(name, { required: field.isRequired ? `${field.label} is required` : false })}
          />
          {error && <p className="text-xs text-destructive">{String(error.message)}</p>}
        </div>
      );

    case "file":
      return (
        <div className={wrapperClass}>
          <Label htmlFor={name} required={field.isRequired}>
            {field.label}
          </Label>
          <Input
            id={name}
            type="file"
            disabled={disabled}
            {...register(name, { required: field.isRequired ? `${field.label} is required` : false })}
            className="cursor-pointer"
          />
          <p className="text-xs text-muted-foreground">
            File upload stores path/URL only. Configure storage separately.
          </p>
          {error && <p className="text-xs text-destructive">{String(error.message)}</p>}
        </div>
      );

    case "relation": {
      const relationModuleId = field.relationModuleId ?? "";
      const { data: listData } = useQuery({
        queryKey: ["records", relationModuleId, "relation"],
        queryFn: () => recordsApi.list(relationModuleId, { limit: 200 }),
        enabled: !!relationModuleId,
      });
      const options = listData?.items ?? [];
      const displayLabel = (r: { id: string; values: Record<string, unknown> }) => {
        const v = r.values;
        const nameLike = (v?.name ?? v?.title ?? v?.applicant_name ?? v?.customer_name ?? v?.contact_name) as string | undefined;
        if (nameLike != null && nameLike !== "") return String(nameLike);
        const first = Object.values(v ?? {}).find((x) => typeof x === "string" && x !== "");
        return first != null ? String(first) : r.id;
      };
      return (
        <div className={wrapperClass}>
          <Label htmlFor={name} required={field.isRequired}>
            {field.label}
          </Label>
          <Controller
            name={name}
            rules={{ required: field.isRequired ? `${field.label} is required` : false }}
            render={({ field: f }) => (
              <select
                id={name}
                value={f.value ?? ""}
                onChange={(e) => f.onChange(e.target.value || undefined)}
                onBlur={f.onBlur}
                className={cn(inputBase, "cursor-pointer")}
                disabled={disabled || !relationModuleId}
              >
                <option value="">Select...</option>
                {options.map((r) => (
                  <option key={r.id} value={r.id}>
                    {displayLabel(r)}
                  </option>
                ))}
              </select>
            )}
          />
          {!relationModuleId && (
            <p className="text-xs text-muted-foreground">Configure a related module in module settings.</p>
          )}
          {error && <p className="text-xs text-destructive">{String(error.message)}</p>}
        </div>
      );
    }

    case "user": {
      const { data: users = [] } = useQuery({
        queryKey: ["users"],
        queryFn: () => usersApi.list(),
      });
      return (
        <div className={wrapperClass}>
          <Label htmlFor={name} required={field.isRequired}>
            {field.label}
          </Label>
          <Controller
            name={name}
            rules={{ required: field.isRequired ? `${field.label} is required` : false }}
            render={({ field: f }) => (
              <select
                id={name}
                value={f.value ?? ""}
                onChange={(e) => f.onChange(e.target.value || undefined)}
                onBlur={f.onBlur}
                className={cn(inputBase, "cursor-pointer")}
                disabled={disabled}
              >
                <option value="">Select user...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            )}
          />
          {error && <p className="text-xs text-destructive">{String(error.message)}</p>}
        </div>
      );
    }

    default:
      return (
        <div className={wrapperClass}>
          <Label htmlFor={name} required={field.isRequired}>
            {field.label}
          </Label>
          <Input
            id={name}
            type={
              field.fieldType === "email"
                ? "email"
                : field.fieldType === "phone"
                  ? "tel"
                  : "text"
            }
            disabled={disabled}
            {...register(name, { required: field.isRequired ? `${field.label} is required` : false })}
            placeholder={field.label}
          />
          {error && <p className="text-xs text-destructive">{String(error.message)}</p>}
        </div>
      );
  }
}
