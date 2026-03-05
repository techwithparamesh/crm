"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formsApi, modulesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FormFieldSelector,
  FormSettingsPanel,
  FormPreview,
} from "@/components/forms/lead-capture";
import type { FormFieldConfig } from "@/lib/api";
import type { ModuleWithFields } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function NewFormPage() {
  const router = useRouter();
  const [modules, setModules] = useState<ModuleWithFields[]>([]);
  const [moduleId, setModuleId] = useState("");
  const [formName, setFormName] = useState("");
  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [successMessage, setSuccessMessage] = useState("Thank you! We'll be in touch.");
  const [isActive, setIsActive] = useState(true);
  const [recaptchaEnabled, setRecaptchaEnabled] = useState(false);
  const [autoAssignUserId, setAutoAssignUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    modulesApi.list().then((list) => setModules(list as ModuleWithFields[])).catch(() => setModules([]));
  }, []);

  const selectedModule = modules.find((m) => m.id === moduleId);
  const availableFields = selectedModule?.fields ?? [];

  const handleSave = async () => {
    if (!moduleId || !formName.trim()) {
      setError("Select a module and enter a form name.");
      return;
    }
    if (fields.length === 0) {
      setError("Add at least one field.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const created = await formsApi.create({
        moduleId,
        formName: formName.trim(),
        fieldsJSON: JSON.stringify(fields),
        redirectUrl: redirectUrl.trim() || null,
        successMessage: successMessage.trim() || null,
        isActive,
        recaptchaEnabled,
        autoAssignUserId: autoAssignUserId || null,
      });
      router.push(`/forms/${created.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create form");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/forms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New form</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Module & fields</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose the module (e.g. Leads, Contacts) and which fields to show on the form.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Module</Label>
                <select
                  className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3"
                  value={moduleId}
                  onChange={(e) => {
                    setModuleId(e.target.value);
                    setFields([]);
                  }}
                >
                  <option value="">Select module...</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedModule && (
                <FormFieldSelector
                  availableFields={availableFields}
                  selected={fields}
                  onChange={setFields}
                />
              )}
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
          <FormPreview formName={formName || "Form"} fields={fields} />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Creating..." : "Create form"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/forms">Cancel</Link>
        </Button>
      </div>
    </div>
  );
}
