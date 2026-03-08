"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { activityLogApi, type ActivityLogEntry } from "@/lib/api";
import {
  Calendar,
  Edit3,
  User,
  GitBranch,
  CheckSquare,
  StickyNote,
  Mail,
  Loader2,
} from "lucide-react";

function formatDate(s: string) {
  const d = new Date(s);
  return d.toLocaleDateString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getEventLabel(entry: ActivityLogEntry): string {
  const meta = entry.metadataJSON
    ? (() => {
        try {
          return JSON.parse(entry.metadataJSON) as Record<string, unknown>;
        } catch {
          return {};
        }
      })()
    : {};
  switch (entry.eventType) {
    case "record_created":
      return "Record created";
    case "record_updated":
      return "Record updated";
    case "stage_changed": {
      const from = meta.previousStageName as string | undefined;
      const to = meta.newStageName as string | undefined;
      if (from && to) return `Stage changed from ${from} to ${to}`;
      if (to) return `Stage changed to ${to}`;
      return "Stage changed";
    }
    case "task_created": {
      const title = meta.title as string | undefined;
      return title ? `Task created: ${title}` : "Task created";
    }
    case "note_added":
      return "Note added";
    case "email_sent": {
      const to = meta.to as string | undefined;
      const subj = meta.subject as string | undefined;
      if (to && subj) return `Email sent to ${to}: ${subj}`;
      if (to) return `Email sent to ${to}`;
      return "Email sent";
    }
    default:
      return entry.eventType.replace(/_/g, " ");
  }
}

function getEventIcon(eventType: string): React.ReactNode {
  switch (eventType) {
    case "record_created":
      return <Calendar className="h-4 w-4 text-muted-foreground" />;
    case "record_updated":
      return <Edit3 className="h-4 w-4 text-muted-foreground" />;
    case "stage_changed":
      return <GitBranch className="h-4 w-4 text-muted-foreground" />;
    case "task_created":
      return <CheckSquare className="h-4 w-4 text-muted-foreground" />;
    case "note_added":
      return <StickyNote className="h-4 w-4 text-muted-foreground" />;
    case "email_sent":
      return <Mail className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Edit3 className="h-4 w-4 text-muted-foreground" />;
  }
}

export interface ActivityTimelineProps {
  recordId: string;
  /** Fallback when no activities yet (e.g. created/updated from record) */
  record?: { createdAt: string; updatedAt: string; creator?: { name: string } | null };
  /** Change to refetch (e.g. after sending email) */
  refreshKey?: number;
  className?: string;
}

export function ActivityTimeline({ recordId, record, refreshKey, className }: ActivityTimelineProps) {
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    activityLogApi
      .listByRecord(recordId, 50)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, [recordId, record?.updatedAt, refreshKey]);

  if (loading) {
    return (
      <div className={cn("space-y-1", className)}>
        <h3 className="text-sm font-semibold mb-3">Activity</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  const hasEntries = entries.length > 0;

  return (
    <div className={cn("space-y-1", className)}>
      <h3 className="text-sm font-semibold mb-3">Activity</h3>
      {!hasEntries && record && (
        <ul className="space-y-0">
          <li className="relative flex gap-3 pb-4">
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </span>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-medium">Record created</p>
              <p className="text-xs text-muted-foreground">{formatDate(record.createdAt)}</p>
              {record.creator?.name && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <User className="h-3 w-3" />
                  {record.creator.name}
                </p>
              )}
            </div>
          </li>
          <li className="relative flex gap-3">
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background">
              <Edit3 className="h-4 w-4 text-muted-foreground" />
            </span>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-medium">Last updated</p>
              <p className="text-xs text-muted-foreground">{formatDate(record.updatedAt)}</p>
            </div>
          </li>
        </ul>
      )}
      {hasEntries && (
        <ul className="space-y-0">
          {entries.map((entry, i) => (
            <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
              {i < entries.length - 1 && (
                <span className="absolute left-[7px] top-5 bottom-0 w-px bg-border" />
              )}
              <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background">
                {getEventIcon(entry.eventType)}
              </span>
              <div className="flex-1 min-w-0 pt-0.5">
                <p className="text-sm font-medium">{entry.message?.trim() || getEventLabel(entry)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(entry.createdAt)}</p>
                {entry.user?.name && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <User className="h-3 w-3" />
                    {entry.user.name}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {!hasEntries && !record && (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      )}
    </div>
  );
}
