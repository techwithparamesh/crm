"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { automationsApi, modulesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TriggerSelector,
  ConditionBuilder,
  ActionBuilder,
  type AutomationCondition,
  type AutomationAction,
} from "@/components/automation-builder";
import type { Module, ModuleWithFields } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function NewAutomationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("record_created");
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [conditions, setConditions] = useState<AutomationCondition[]>([]);
  const [actions, setActions] = useState<AutomationAction[]>([{ type: "create_task", params: {} }]);
  const [isActive, setIsActive] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleFields, setModuleFields] = useState<ModuleWithFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    modulesApi.list().then((list) => setModules(list));
  }, []);

  useEffect(() => {
    if (!moduleId) {
      setModuleFields(null);
      return;
    }
    modulesApi.get(moduleId).then((m) => setModuleFields(m)).catch(() => setModuleFields(null));
  }, [moduleId]);

  const fields = moduleFields?.fields ?? [];

  const handleSave = async () => {
    setError("");
    if (actions.length === 0) {
      setError("Add at least one action.");
      return;
    }
    setSaving(true);
    try {
      const automation = await automationsApi.create({
        name: name.trim() || undefined,
        moduleId: moduleId ?? undefined,
        triggerType,
        conditionsJSON: conditions.length > 0 ? JSON.stringify(conditions) : undefined,
        actionsJSON: JSON.stringify(actions),
        isActive,
      });
      router.push(`/automations/${automation.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create automation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/automations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New automation</h1>
          <p className="text-sm text-muted-foreground">Configure trigger, conditions, and actions. Stored as JSON.</p>
        </div>
      </div>

      <div className="space-y-2 max-w-md">
        <Label htmlFor="name">Name (optional)</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. New lead → Create task"
        />
      </div>

      <TriggerSelector
        triggerType={triggerType}
        moduleId={moduleId}
        modules={modules}
        onTriggerChange={setTriggerType}
        onModuleChange={setModuleId}
      />

      <ConditionBuilder
        conditions={conditions}
        fields={fields}
        onChange={setConditions}
      />

      <ActionBuilder
        actions={actions}
        fields={fields}
        onChange={setActions}
        modules={modules}
        moduleId={moduleId}
      />

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded border-input"
          />
          <span className="text-sm">Active</span>
        </label>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Create automation"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/automations">Cancel</Link>
        </Button>
      </div>
    </div>
  );
}
