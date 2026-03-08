"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";

export type MetricCardIconColor = "purple" | "indigo" | "blue" | "teal";

const iconColorClasses: Record<MetricCardIconColor, string> = {
  purple: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
  indigo: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400",
  teal: "bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-400",
};

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  iconColor?: MetricCardIconColor;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  className?: string;
}

/** Premium metric card: icon in colored circle, large value, label, optional trend. */
export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = "purple",
  trend,
  trendLabel,
  className,
}: MetricCardProps) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor =
    trend === "up"
      ? "text-emerald-600 dark:text-emerald-400"
      : trend === "down"
        ? "text-red-600 dark:text-red-400"
        : "text-muted-foreground";

  return (
    <Card
      className={cn(
        "rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {Icon && (
          <span className={cn("flex h-10 w-10 items-center justify-center rounded-full", iconColorClasses[iconColor])}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
        {(description || trendLabel) && (
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            {description && <span>{description}</span>}
            {trendLabel && (
              <span className={cn("inline-flex items-center gap-0.5", trendColor)}>
                <TrendIcon className="h-3 w-3" />
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
