"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { recordsApi, modulesApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { canEditRecord, canDeleteRecord } from "@/lib/permissions";
import { DynamicFormRenderer, buildDefaultValues } from "@/components/forms";
import {
  ActivityTimeline,
  RelatedTasks,
  NotesSection,
  AttachmentsSection,
  RelatedRecordsSection,
  SendEmailSection,
  RecordFilesSection,
  type AttachmentItem,
} from "@/components/record-detail";
import { WhatsAppChatPanel } from "@/components/whatsapp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecordDetail } from "@/lib/api";
import type { ModuleWithFields } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

const NOTES_FIELD_KEY = "notes";
const ATTACHMENTS_FIELD_KEY = "attachments";

export default function RecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params.recordId as string;
  const user = useAuthStore((s) => s.user);
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [moduleData, setModuleData] = useState<ModuleWithFields | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [activityRefresh, setActivityRefresh] = useState(0);
  const recordCreatedBy = record?.creator?.id ?? null;
  const canEdit = record && user ? canEditRecord(user.permissions ?? null, record.moduleId, recordCreatedBy, user.id) : false;
  const canDelete = record && user ? canDeleteRecord(user.permissions ?? null, record.moduleId, recordCreatedBy, user.id) : false;

  useEffect(() => {
    recordsApi.get(recordId).then(setRecord).catch(() => setRecord(null));
  }, [recordId]);

  useEffect(() => {
    if (record?.moduleId) {
      modulesApi.get(record.moduleId).then(setModuleData).catch(() => setModuleData(null));
    }
  }, [record?.moduleId]);

  const handleSaveValues = async (values: Record<string, unknown>) => {
    setError("");
    setSaving(true);
    try {
      const updated = await recordsApi.update(recordId, { values });
      setRecord(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSingleField = async (fieldKey: string, value: unknown) => {
    setSaving(true);
    try {
      const updated = await recordsApi.update(recordId, {
        values: { ...record?.values, [fieldKey]: value },
      });
      setRecord(updated);
    } finally {
      setSaving(false);
    }
  };

  if (!record) return <p className="text-muted-foreground">Loading...</p>;

  const moduleId = record.moduleId;
  const attachmentsFieldKey =
    moduleData?.fields.find(
      (f) => f.fieldKey === ATTACHMENTS_FIELD_KEY || f.fieldKey === "files"
    )?.fieldKey ?? ATTACHMENTS_FIELD_KEY;
  const notesValue = String(record.values[NOTES_FIELD_KEY] ?? "");
  const attachmentsValue = record.values[attachmentsFieldKey];

  const formFields =
    moduleData?.fields.filter(
      (f) =>
        f.fieldKey !== NOTES_FIELD_KEY &&
        f.fieldKey !== "files" &&
        f.fieldKey !== ATTACHMENTS_FIELD_KEY
    ) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href={`/records/${moduleId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold truncate">
              {record.module?.name ?? "Record"} — Detail
            </h1>
            {record.creator && (
              <p className="text-sm text-muted-foreground">
                Created by {record.creator.name}
              </p>
            )}
          </div>
        </div>
        {canDelete && (
          <Button
            variant="destructive"
            size="sm"
            className="shrink-0 w-full sm:w-auto"
            onClick={async () => {
              if (!confirm("Delete this record?")) return;
              try {
                await recordsApi.delete(recordId);
                router.push(`/records/${moduleId}`);
              } catch (e) {
                alert(e instanceof Error ? e.message : "Delete failed");
              }
            }}
          >
            Delete
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Field values form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <p className="text-sm text-destructive mb-4">{error}</p>
              )}
              {moduleData && formFields.length > 0 ? (
                <DynamicFormRenderer
                  key={`${recordId}-${record.updatedAt}`}
                  fields={formFields}
                  defaultValues={record.values}
                  onSubmit={handleSaveValues}
                  submitLabel="Save"
                  layout="grid"
                  isSubmitting={saving}
                  readOnly={!canEdit}
                  footer={
                    <Button type="button" variant="outline" asChild>
                      <Link href={`/records/${moduleId}`}>Back to list</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-2">
                  {Object.entries(record.values).map(([key, val]) => (
                    <div key={key} className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-muted-foreground">
                        {key}
                      </span>
                      <span className="text-sm">
                        {typeof val === "object"
                          ? JSON.stringify(val)
                          : String(val)}
                      </span>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" asChild className="mt-4">
                    <Link href={`/records/${moduleId}`}>Back to list</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Activity, Tasks, Notes, Attachments */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <ActivityTimeline recordId={recordId} record={record} refreshKey={activityRefresh} />
            </CardContent>
          </Card>

          <SendEmailSection
            recordId={recordId}
            defaultTo={typeof record.values?.email === "string" ? String(record.values.email) : ""}
            onSent={() => setActivityRefresh((n) => n + 1)}
          />

          <WhatsAppChatPanel
            recordId={recordId}
            defaultPhone={
              typeof record.values?.phone === "string"
                ? String(record.values.phone)
                : typeof record.values?.mobile === "string"
                  ? String(record.values.mobile)
                  : ""
            }
            recordValues={record.values ?? {}}
          />

          <RelatedTasks recordId={recordId} />

          <RelatedRecordsSection recordId={recordId} moduleId={moduleId} />

          <RecordFilesSection recordId={recordId} />

          <NotesSection
            value={notesValue}
            fieldKey={NOTES_FIELD_KEY}
            onSave={async (key, val) => handleSaveSingleField(key, val)}
          />

          <AttachmentsSection
            value={attachmentsValue ?? []}
            fieldKey={attachmentsFieldKey}
            onSave={async (key, val: AttachmentItem[]) =>
              handleSaveSingleField(key, val)
            }
          />
        </div>
      </div>
    </div>
  );
}
