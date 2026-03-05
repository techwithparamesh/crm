"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import type { FormSubmissionItem } from "@/lib/api";

export interface SubmissionListProps {
  formId: string;
  submissions: FormSubmissionItem[];
  loading?: boolean;
  recordDetailPath?: (recordId: string) => string;
}

export function SubmissionList({
  formId,
  submissions,
  loading,
  recordDetailPath = (id) => `/record/${id}`,
}: SubmissionListProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submissions</CardTitle>
        <p className="text-sm text-muted-foreground">
          {submissions.length} submission{submissions.length !== 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions yet.</p>
        ) : (
          <ul className="space-y-3">
            {submissions.map((s) => {
              let payload: Record<string, unknown> = {};
              try {
                payload = JSON.parse(s.payloadJSON) as Record<string, unknown>;
              } catch {
                // ignore
              }
              const preview = Object.entries(payload)
                .slice(0, 3)
                .map(([k, v]) => `${k}: ${String(v).slice(0, 30)}`)
                .join(" · ");
              return (
                <li
                  key={s.id}
                  className="flex flex-col gap-1 rounded-md border p-3 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <Link
                      href={recordDetailPath(s.recordId)}
                      className="font-medium text-primary hover:underline"
                    >
                      Record #{s.recordId.slice(-8)}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {s.sourceIP && (
                    <span className="text-xs text-muted-foreground">IP: {s.sourceIP}</span>
                  )}
                  <p className="text-muted-foreground truncate">{preview || "—"}</p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
