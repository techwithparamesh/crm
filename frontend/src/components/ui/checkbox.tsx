"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "checked" | "onChange"> {
  checked?: boolean | "indeterminate";
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => (
    <input
      type="checkbox"
      ref={ref}
      checked={checked === "indeterminate" ? false : !!checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={cn(
        "h-4 w-4 shrink-0 rounded border border-primary shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 accent-primary",
        className
      )}
      {...props}
    />
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
