"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Skeleton for dashboard metrics row (4 cards). */
export function DashboardMetricsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}

/** Skeleton for dashboard charts row (2 charts). */
export function DashboardChartsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2", className)}>
      <Skeleton className="h-64 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

/** Skeleton for dashboard tables row (2 tables). */
export function DashboardTablesSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-6 md:grid-cols-2", className)}>
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}

/** Skeleton for module/record list cards (grid). */
export function CardGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
  );
}

/** Full dashboard page skeleton. */
export function DashboardPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <DashboardMetricsSkeleton />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-20" />
        <DashboardChartsSkeleton />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <DashboardTablesSkeleton />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  );
}
