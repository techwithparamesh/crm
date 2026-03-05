"use client";

import { useEffect, useState } from "react";
import { tasksApi } from "@/lib/api";
import type { Task } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Plus } from "lucide-react";
import Link from "next/link";

export interface RelatedTasksProps {
  recordId: string;
  onAddTask?: () => void;
  className?: string;
}

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

export function RelatedTasks({ recordId, onAddTask, className }: RelatedTasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tasksApi
      .list({ relatedRecordId: recordId })
      .then(setTasks)
      .finally(() => setLoading(false));
  }, [recordId]);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between py-3">
        <CardTitle className="text-sm font-semibold">Tasks</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
          <Link href={`/tasks?relatedRecordId=${recordId}`}>
            <Plus className="h-3 w-3 mr-1" /> Add
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No tasks linked to this record.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                className={`flex items-start gap-2 rounded-md border p-2 text-sm ${t.status === "completed" ? "opacity-70 bg-muted/30" : ""}`}
              >
                {t.status === "completed" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 mt-0.5" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{t.title || "Untitled task"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDue(t.dueDate)}
                    {t.assignee?.name && ` · ${t.assignee.name}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
