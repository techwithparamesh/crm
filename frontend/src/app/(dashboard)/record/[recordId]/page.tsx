"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { recordsApi, modulesApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { canEditRecord, canDeleteRecord } from "@/lib/permissions";
import { DynamicFormRenderer, buildDefaultValues } from "@/components/forms";
import {
  ActivityPanel,
  RelatedRecordsSection,
  AttachmentsSection,
  type AttachmentItem,
} from "@/components/record-detail";
import { WhatsAppChatPanel } from "@/components/whatsapp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecordDetail } from "@/lib/api";
import type { ModuleWithFields } from "@/lib/api";
import { ArrowLeft, Pencil } from "lucide-react";

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
  const [savedFeedback, setSavedFeedback] = useState(false);
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

  const showSaved = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleSaveValues = async (values: Record<string, unknown>) => {
    setError("");
    setSaving(true);
    try {
      const updated = await recordsApi.update(recordId, { values });
      setRecord(updated);
      setActivityRefresh((n) => n + 1);
      showSaved();
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
      setActivityRefresh((n) => n + 1);
      showSaved();
    } finally {
      setSaving(false);
    }
  };

  if (!record) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />
          <div className="space-y-1">
            <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-20 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-2">
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
            <div className="h-32 bg-muted rounded animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-6 w-24 bg-muted rounded animate-pulse" />
            <div className="h-24 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

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

  // Business-card fields: name, phone, email (or first few text/phone/email)
  const keyFieldKeys = ["name", "full_name", "phone", "email", "mobile", "company"];
  const businessCardFields =
    moduleData?.fields.filter(
      (f) =>
        formFields.some((ff) => ff.id === f.id) &&
        (keyFieldKeys.includes(f.fieldKey) ||
          ["text", "phone", "email"].includes(f.fieldType))
    ) ?? [];
  const cardFields = businessCardFields.slice(0, 4);

  const recordName = record.values?.name ?? record.values?.full_name ?? record.module?.name ?? "Record";
  const recordStage = record.stage?.stageName;

  return (
    <div className="space-y-6">
      {/* Top: Business card header — name, key fields, owner, stage, actions */}
      <Card className="bg-muted/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <Button variant="ghost" size="icon" asChild className="shrink-0 mt-0.5">
                  <Link href={`/records/${moduleId}`}>
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold truncate">{String(recordName)}</h1>
                  <p className="text-sm text-muted-foreground">
                    {record.module?.name}
                    {record.creator && ` · Created by ${record.creator.name}`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {savedFeedback && (
                  <span className="text-sm text-green-600 font-medium">Saved</span>
                )}
                {canEdit && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/record/${recordId}`}>
                      <Pencil className="h-4 w-4 mr-1.5" />
                      Edit
                    </Link>
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
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
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {cardFields.map((f) => {
                const val = record.values?.[f.fieldKey];
                let display = "—";
                if (f.fieldType === "relation" && record.relationDisplay?.[f.fieldKey]) {
                  display = record.relationDisplay[f.fieldKey];
                } else if (f.fieldType === "user" && record.userDisplay?.[f.fieldKey]) {
                  display = record.userDisplay[f.fieldKey];
                } else if (val != null && val !== "") {
                  display = typeof val === "object" ? JSON.stringify(val) : String(val);
                }
                return (
                  <div key={f.id} className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-muted-foreground">{f.label}</span>
                    <span className="text-sm font-medium">{display}</span>
                  </div>
                );
              })}
              {recordStage && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-muted-foreground">Stage</span>
                  <span className="text-sm font-medium">{recordStage}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details form, Relationships, Attachments */}
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
                  {Object.entries(record.values).map(([key, val]) => {
                    const relLabel = record.relationDisplay?.[key];
                    const userLabel = record.userDisplay?.[key];
                    const display =
                      relLabel ?? userLabel ?? (typeof val === "object" ? JSON.stringify(val) : val != null && val !== "" ? String(val) : "—");
                    return (
                      <div key={key} className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-muted-foreground">{key}</span>
                        <span className="text-sm">{display}</span>
                      </div>
                    );
                  })}
                  <Button variant="outline" size="sm" asChild className="mt-4">
                    <Link href={`/records/${moduleId}`}>Back to list</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <RelatedRecordsSection recordId={recordId} moduleId={moduleId} />

          <AttachmentsSection
            value={attachmentsValue ?? []}
            fieldKey={attachmentsFieldKey}
            onSave={async (key, val: AttachmentItem[]) => handleSaveSingleField(key, val)}
          />
        </div>

        {/* Right: Activity panel (tabs) + WhatsApp */}
        <div className="space-y-6">
          <ActivityPanel
            recordId={recordId}
            record={record}
            notesValue={notesValue}
            notesFieldKey={NOTES_FIELD_KEY}
            onNotesSave={handleSaveSingleField}
            onCommentAdded={() => setActivityRefresh((n) => n + 1)}
            activityRefreshKey={activityRefresh}
            defaultEmail={typeof record.values?.email === "string" ? String(record.values.email) : ""}
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
        </div>
      </div>
    </div>
  );
}
