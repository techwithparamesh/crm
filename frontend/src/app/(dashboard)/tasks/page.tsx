"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { tasksApi } from "@/lib/api";
import type { Task } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { MobileTaskCard } from "@/components/tasks/MobileTaskCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function TasksPage() {
  const searchParams = useSearchParams();
  const relatedRecordId = searchParams.get("relatedRecordId") ?? undefined;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tasksApi
      .list({ relatedRecordId })
      .then(setTasks)
      .finally(() => setLoading(false));
  }, [relatedRecordId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold">Tasks</h1>
        <Button asChild size="sm" className="w-fit">
          <Link href={relatedRecordId ? `/tasks/new?relatedRecordId=${relatedRecordId}` : "/tasks/new"}>
            <Plus className="h-4 w-4 mr-2" />
            Add task
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All tasks</CardTitle>
          {relatedRecordId && (
            <p className="text-sm text-muted-foreground">Filtered by linked record</p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading...</p>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No tasks yet.</p>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li key={task.id}>
                  <MobileTaskCard
                    task={task}
                    href={task.relatedRecordId ? `/record/${task.relatedRecordId}` : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
