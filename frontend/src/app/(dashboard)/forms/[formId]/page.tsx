"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formsApi, modulesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormFieldSelector,
  FormSettingsPanel,
  FormPreview,
  SubmissionList,
} from "@/components/forms/lead-capture";
import type { FormFieldConfig, WebFormDetail } from "@/lib/api";
import type { ModuleWithFields } from "@/lib/api";
import { ArrowLeft, Code, Copy } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function FormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;
  const [form, setForm] = useState<WebFormDetail | null>(null);
  const [moduleData, setModuleData] = useState<ModuleWithFields | null>(null);
  const [submissions, setSubmissions] = useState<typeof import("@/lib/api").FormSubmissionItem[]>([]);
  const [analytics, setAnalytics] = useState<{ views: number; submissions: number; conversionRate: number } | null>(null);
  const [formName, setFormName] = useState("");
  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [recaptchaEnabled, setRecaptchaEnabled] = useState(false);
  const [autoAssignUserId, setAutoAssignUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"build" | "submissions" | "embed">("build");

  useEffect(() => {
    formsApi.get(formId).then((f) => {
      setForm(f);
      setFormName(f.formName);
      setRedirectUrl(f.redirectUrl ?? "");
      setSuccessMessage(f.successMessage ?? "");
      setIsActive(f.isActive);
      setRecaptchaEnabled(f.recaptchaEnabled);
      setAutoAssignUserId(f.autoAssignUserId ?? "");
      try {
        setFields(JSON.parse(f.fieldsJSON) as FormFieldConfig[]);
      } catch {
        setFields([]);
      }
      if (f.moduleId) {
        modulesApi.get(f.moduleId).then(setModuleData).catch(() => setModuleData(null));
      }
    }).catch(() => setForm(null));
  }, [formId]);

  useEffect(() => {
    if (!formId) return;
    formsApi.getSubmissions(formId).then(setSubmissions).catch(() => setSubmissions([]));
    formsApi.getAnalytics(formId).then(setAnalytics).catch(() => setAnalytics(null));
  }, [formId]);

  const handleSave = async () => {
    if (!form) return;
    setError("");
    setSaving(true);
    try {
      const updated = await formsApi.update(formId, {
        formName,
        fieldsJSON: JSON.stringify(fields),
        redirectUrl: redirectUrl.trim() || null,
        successMessage: successMessage.trim() || null,
        isActive,
        recaptchaEnabled,
        autoAssignUserId: autoAssignUserId || null,
      });
      setForm(updated as WebFormDetail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const embedSnippet = `<!-- CRM form embed -->
<script src="${API_BASE || "https://your-api.com"}/forms/embed.js"><\/script>
<div data-crm-form="${formId}"></div>`;

  if (!form) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{form.formName}</h1>
            <p className="text-sm text-muted-foreground">{form.module?.name ?? form.moduleId}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab("embed")}>
            <Code className="h-4 w-4 mr-2" />
            Embed code
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 border-b">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === "build" ? "border-primary text-primary" : "border-transparent"
          }`}
          onClick={() => setActiveTab("build")}
        >
          Build
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === "submissions" ? "border-primary text-primary" : "border-transparent"
          }`}
          onClick={() => setActiveTab("submissions")}
        >
          Submissions
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === "embed" ? "border-primary text-primary" : "border-transparent"
          }`}
          onClick={() => setActiveTab("embed")}
        >
          Embed
        </button>
      </div>

      {activeTab === "build" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fields</CardTitle>
              </CardHeader>
              <CardContent>
                {moduleData && (
                  <FormFieldSelector
                    availableFields={moduleData.fields}
                    selected={fields}
                    onChange={setFields}
                  />
                )}
                {!moduleData && <p className="text-sm text-muted-foreground">Loading module...</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <FormSettingsPanel
                  formName={formName}
                  redirectUrl={redirectUrl}
                  successMessage={successMessage}
                  isActive={isActive}
                  recaptchaEnabled={recaptchaEnabled}
                  autoAssignUserId={autoAssignUserId}
                  onFormNameChange={setFormName}
                  onRedirectUrlChange={setRedirectUrl}
                  onSuccessMessageChange={setSuccessMessage}
                  onIsActiveChange={setIsActive}
                  onRecaptchaEnabledChange={setRecaptchaEnabled}
                  onAutoAssignUserIdChange={setAutoAssignUserId}
                />
              </CardContent>
            </Card>
          </div>
          <div>
            <FormPreview formName={formName} fields={fields} />
          </div>
        </div>
      )}

      {activeTab === "submissions" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SubmissionList formId={formId} submissions={submissions} />
          </div>
          {analytics && (
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm"><span className="font-medium">Views:</span> {analytics.views}</p>
                <p className="text-sm"><span className="font-medium">Submissions:</span> {analytics.submissions}</p>
                <p className="text-sm"><span className="font-medium">Conversion rate:</span> {analytics.conversionRate}%</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "embed" && (
        <Card>
          <CardHeader>
            <CardTitle>Embed on your site</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add this snippet to your website or landing page. The form will load dynamically.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="p-4 bg-muted rounded-md text-sm overflow-x-auto whitespace-pre-wrap">
              {embedSnippet}
            </pre>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(embedSnippet);
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </CardContent>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
