"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import type { Automation } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

function parseConditionsJSON(json: string | null): AutomationCondition[] {
  if (!json?.trim()) return [];
  try {
    const arr = JSON.parse(json) as unknown;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function parseActionsJSON(json: string): AutomationAction[] {
  if (!json?.trim()) return [];
  try {
    const arr = JSON.parse(json) as unknown;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default function EditAutomationPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("record_created");
  const [moduleId, setModuleId] = useState<string | null>(null);
  const [conditions, setConditions] = useState<AutomationCondition[]>([]);
  const [actions, setActions] = useState<AutomationAction[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [modules, setModules] = useState<Module[]>([]);
  const [moduleFields, setModuleFields] = useState<ModuleWithFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    automationsApi
      .get(id)
      .then((a) => {
        setAutomation(a);
        setName(a.name ?? "");
        setTriggerType(a.triggerType);
        setModuleId(a.moduleId ?? null);
        setConditions(parseConditionsJSON(a.conditionsJSON));
        setActions(parseActionsJSON(a.actionsJSON).length > 0 ? parseActionsJSON(a.actionsJSON) : [{ type: "create_task", params: {} }]);
        setIsActive(a.isActive);
      })
      .catch(() => setAutomation(null))
      .finally(() => setLoading(false));
  }, [id]);

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
      await automationsApi.update(id, {
        name: name.trim() || undefined,
        moduleId: moduleId ?? undefined,
        triggerType,
        conditionsJSON: conditions.length > 0 ? JSON.stringify(conditions) : undefined,
        actionsJSON: JSON.stringify(actions),
        isActive,
      });
      setAutomation((prev) =>
        prev
          ? {
              ...prev,
              name: name.trim() || null,
              moduleId,
              triggerType,
              conditionsJSON: conditions.length > 0 ? JSON.stringify(conditions) : null,
              actionsJSON: JSON.stringify(actions),
              isActive,
            }
          : null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this automation?")) return;
    try {
      await automationsApi.delete(id);
      router.push("/automations");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (!automation) return <p className="text-destructive">Automation not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/automations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit automation</h1>
            <p className="text-sm text-muted-foreground">Trigger, conditions, and actions stored as JSON.</p>
          </div>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          Delete
        </Button>
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
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/automations">Cancel</Link>
        </Button>
      </div>
    </div>
  );
}
