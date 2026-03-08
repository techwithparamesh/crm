"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export interface OnboardingPanelProps {
  title: string;
  description?: string;
  actions: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

/** Premium onboarding panel: headline, description, and action buttons. */
export function OnboardingPanel({
  title,
  description,
  actions,
  icon,
  className,
}: OnboardingPanelProps) {
  return (
    <Card
      className={cn(
        "rounded-xl border-2 border-dashed border-border bg-muted/10",
        className
      )}
    >
      <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
        {icon && (
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 [&_svg]:h-7 [&_svg]:w-7">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold mb-1 text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-6 max-w-md">{description}</p>
        )}
        <div className="flex flex-wrap justify-center gap-3">{actions}</div>
      </CardContent>
    </Card>
  );
}
