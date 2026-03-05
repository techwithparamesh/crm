"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Calendar, User } from "lucide-react";
import type { Task } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function formatDue(d: string | null): string {
  if (!d) return "No date";
  const date = new Date(d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  if (due.getTime() === today.getTime()) return "Today";
  if (due.getTime() < today.getTime()) return "Overdue";
  return date.toLocaleDateString(undefined, { dateStyle: "short" });
}

function statusLabel(s: string): string {
  return s === "completed" ? "Done" : s === "pending" ? "To do" : s;
}

export interface MobileTaskCardProps {
  task: Task;
  href?: string;
  className?: string;
}

export function MobileTaskCard({ task, href, className }: MobileTaskCardProps) {
  const content = (
    <Card
      className={cn(
        "transition-colors hover:bg-muted/50",
        task.status === "completed" && "opacity-80 bg-muted/30",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="shrink-0 pt-0.5">
            {task.status === "completed" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-medium truncate">{task.title || "Untitled task"}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDue(task.dueDate)}
              </span>
              {task.assignee?.name && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {task.assignee.name}
                </span>
              )}
              <span className="capitalize">{statusLabel(task.status)}</span>
            </div>
            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{task.description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
