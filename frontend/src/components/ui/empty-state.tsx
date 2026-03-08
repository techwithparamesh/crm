"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Enterprise-style empty state: single primary CTA, minimal cognitive load. */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 p-8 sm:p-12 text-center",
        className
      )}
    >
      {icon && <div className="mb-4 text-muted-foreground [&_svg]:h-12 [&_svg]:w-12">{icon}</div>}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>}
      {action && <div className="flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
