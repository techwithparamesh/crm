"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  dashboardsApi,
  modulesApi,
  pipelinesApi,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DynamicWidget,
  WidgetConfigForm,
  parseWidgetConfig,
  stringifyWidgetConfig,
  type WidgetConfig,
  type WidgetType,
} from "@/components/dashboard-builder";
import type { DashboardWithWidgets } from "@/lib/api";
import type { ModuleWithFields } from "@/lib/api";
import type { PipelineWithStages } from "@/lib/api";
import type { Widget } from "@/lib/api";
import { ArrowLeft, Plus } from "lucide-react";

export default function DashboardBuilderPage() {
  const params = useParams();
  const id = params.id as string;
  const [dashboard, setDashboard] = useState<DashboardWithWidgets | null>(null);
  const [modules, setModules] = useState<ModuleWithFields[]>([]);
  const [pipelines, setPipelines] = useState<PipelineWithStages[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  const [newWidgetType, setNewWidgetType] = useState<WidgetType>("metric_card");
  const [newWidgetConfig, setNewWidgetConfig] = useState<WidgetConfig>({ moduleId: "" });
  const [saving, setSaving] = useState(false);

  const loadDashboard = () => {
    dashboardsApi.get(id).then(setDashboard).catch(() => setDashboard(null));
  };

  useEffect(() => {
    loadDashboard();
  }, [id]);

  useEffect(() => {
    modulesApi.list().then((list) => {
      Promise.all(list.map((m) => modulesApi.get(m.id))).then((arr) => setModules(arr as ModuleWithFields[]));
    }).catch(() => setModules([]));
    pipelinesApi.list().then(setPipelines).catch(() => setPipelines([]));
  }, []);

  useEffect(() => {
    if (dashboard) setLoading(false);
  }, [dashboard]);

  const stagesForModule = (moduleId: string) => {
    return pipelines
      .filter((p) => p.moduleId === moduleId)
      .flatMap((p) => p.stages ?? []);
  };

  const fieldsForModule = (moduleId: string) => {
    const m = modules.find((x) => x.id === moduleId);
    return m?.fields ?? [];
  };

  const handleAddWidget = async () => {
    if (!dashboard || !newWidgetConfig.moduleId) return;
    setSaving(true);
    try {
      await dashboardsApi.createWidget({
        dashboardId: dashboard.id,
        widgetType: newWidgetType,
        configJSON: stringifyWidgetConfig(newWidgetConfig),
        orderIndex: dashboard.widgets.length,
      });
      loadDashboard();
      setModal(null);
      setNewWidgetConfig({ moduleId: "" });
      setNewWidgetType("metric_card");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to add widget");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateWidget = async () => {
    if (!editingWidget) return;
    setSaving(true);
    try {
      await dashboardsApi.updateWidget(editingWidget.id, {
        configJSON: stringifyWidgetConfig(newWidgetConfig),
        widgetType: newWidgetType,
      });
      loadDashboard();
      setModal(null);
      setEditingWidget(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (w: Widget) => {
    setEditingWidget(w);
    setNewWidgetType((w.widgetType as WidgetType) || "metric_card");
    setNewWidgetConfig(parseWidgetConfig(w.configJSON));
    setModal("edit");
  };

  const handleDeleteWidget = async (w: Widget) => {
    if (!confirm("Remove this widget?")) return;
    try {
      await dashboardsApi.deleteWidget(w.id);
      loadDashboard();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  if (loading && !dashboard) return <p className="text-muted-foreground">Loading…</p>;
  if (!dashboard) return <p className="text-destructive">Dashboard not found.</p>;

  const stages = stagesForModule(newWidgetConfig.moduleId);
  const fields = fieldsForModule(newWidgetConfig.moduleId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboards">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{dashboard.name}</h1>
            <p className="text-sm text-muted-foreground">Add widgets and configure data source, chart type, and filters.</p>
          </div>
        </div>
        <Button onClick={() => { setModal("add"); setNewWidgetConfig({ moduleId: "" }); setNewWidgetType("metric_card"); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add widget
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {dashboard.widgets.map((w) => (
          <DynamicWidget
            key={w.id}
            widgetType={w.widgetType}
            config={parseWidgetConfig(w.configJSON)}
            onEdit={() => openEdit(w)}
            onDelete={() => handleDeleteWidget(w)}
            isEditing
          />
        ))}
      </div>

      {dashboard.widgets.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No widgets yet. Click &quot;Add widget&quot; to add metric cards, bar/pie charts, or tables.</p>
          </CardContent>
        </Card>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(null)}>
          <Card className="w-full max-w-lg max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{modal === "add" ? "Add widget" : "Edit widget"}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setModal(null)}>Close</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <WidgetConfigForm
                widgetType={newWidgetType}
                config={newWidgetConfig}
                modules={modules}
                fields={fields}
                stages={stages}
                onChange={setNewWidgetConfig}
                onWidgetTypeChange={setNewWidgetType}
              />
              <div className="flex gap-2 pt-2">
                {modal === "add" ? (
                  <Button onClick={handleAddWidget} disabled={saving || !newWidgetConfig.moduleId}>
                    {saving ? "Adding…" : "Add widget"}
                  </Button>
                ) : (
                  <Button onClick={handleUpdateWidget} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                  </Button>
                )}
                <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
