"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  modulesApi,
  dashboardsApi,
  pipelinesApi,
  roleDashboardsApi,
  recordsApi,
  tasksApi,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/ui/metric-card";
import { DashboardPageSkeleton } from "@/components/ui/skeleton-loaders";
import { cn } from "@/lib/utils";
import type { ModuleWithCount } from "@/lib/api";
import type { RecordListItem } from "@/lib/api";
import type { Task } from "@/lib/api";
import {
  Layers,
  BarChart3,
  GitBranch,
  Plus,
  ArrowRight,
  LayoutDashboard,
  Database,
  LayoutTemplate,
  Upload,
  TrendingUp,
  PieChart,
  ListTodo,
  FolderOpen,
} from "lucide-react";

export default function DashboardPage() {
  const [modules, setModules] = useState<ModuleWithCount[]>([]);
  const [dashboards, setDashboards] = useState<{ id: string; name: string }[]>([]);
  const [pipelines, setPipelines] = useState<{ id: string; name: string; module?: { name: string }; stages?: unknown[] }[]>([]);
  const [roleDashboard, setRoleDashboard] = useState<{ id: string; name: string } | null>(null);
  const [recentRecords, setRecentRecords] = useState<RecordListItem[]>([]);
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      modulesApi.list(),
      dashboardsApi.list(),
      pipelinesApi.list(),
      roleDashboardsApi.getForMe().then((r) => r.dashboard).catch(() => null),
    ])
      .then(([mods, dash, pipe, roleDash]) => {
        setModules(mods);
        setDashboards(dash);
        setPipelines(pipe);
        setRoleDashboard(roleDash ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (modules.length === 0) return;
    const firstId = modules[0].id;
    recordsApi.list(firstId, { limit: 5 }).then((r) => setRecentRecords(r.items)).catch(() => {});
  }, [modules]);

  useEffect(() => {
    tasksApi.list().then(setRecentTasks).catch(() => []);
  }, []);

  const totalRecords = modules.reduce((s, m) => s + ((m as ModuleWithCount)._count?.records ?? 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const tasksDueToday = recentTasks.filter((t) => (t as Task & { dueDate?: string }).dueDate?.slice(0, 10) === today);

  const isEmpty = !loading && modules.length === 0 && pipelines.length === 0;
  const firstModuleId = modules[0]?.id;

  if (loading) {
    return <DashboardPageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your workspace and quick actions
        </p>
      </div>

      {/* First row: Top metrics */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Overview
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Modules"
            value={modules.length}
            description="Configured modules"
            icon={Layers}
            iconColor="purple"
          />
          <MetricCard
            title="Total Pipelines"
            value={pipelines.length}
            description="Workflow pipelines"
            icon={GitBranch}
            iconColor="indigo"
          />
          <MetricCard
            title="Total Dashboards"
            value={dashboards.length}
            description="Custom dashboards"
            icon={BarChart3}
            iconColor="blue"
          />
          <MetricCard
            title="Total Records"
            value={totalRecords}
            description="Across all modules"
            icon={Database}
            iconColor="teal"
          />
        </div>
      </section>

      {/* Get started when workspace has modules but no records yet */}
      {modules.length > 0 && totalRecords === 0 && (
        <Card className="rounded-xl border border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Get started in 3 steps</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add your first records, then use pipelines to move them through stages.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">1</span>
                <div className="min-w-0">
                  <p className="font-medium text-sm">Add your first record</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Start with the first module (e.g. Leads).</p>
                  <Button size="sm" className="mt-2 rounded-lg" asChild>
                    <Link href={firstModuleId ? `/records/${firstModuleId}/new` : "/modules"}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add {modules[0]?.name?.toLowerCase() ?? "record"}
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">2</span>
                <div className="min-w-0">
                  <p className="font-medium text-sm">View and manage records</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Open a module to see its list and add more.</p>
                  <Button size="sm" variant="outline" className="mt-2 rounded-lg" asChild>
                    <Link href={firstModuleId ? `/records/${firstModuleId}` : "/modules"}>
                      <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
                      Open {modules[0]?.name ?? "module"}
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border border-border bg-card p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">3</span>
                <div className="min-w-0">
                  <p className="font-medium text-sm">Use pipelines</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Move records through stages (e.g. Lead → Approved).</p>
                  <Button size="sm" variant="outline" className="mt-2 rounded-lg" asChild>
                    <Link href={pipelines.length > 0 ? `/pipelines/${pipelines[0].id}` : "/pipelines"}>
                      <GitBranch className="h-3.5 w-3.5 mr-1.5" />
                      {pipelines.length > 0 ? "Open pipeline" : "Create pipeline"}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role-based dashboard CTA */}
      {roleDashboard && (
        <Card className="rounded-xl border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              Your dashboard
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Open your role-assigned dashboard to see metrics and reports.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild className="rounded-lg">
              <Link href={`/dashboards/${roleDashboard.id}`}>
                {roleDashboard.name}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Second row: Charts */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Insights
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Records trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
                Add a dashboard with a time series widget to see trends
              </div>
              {dashboards.length > 0 && (
                <Button variant="outline" size="sm" className="mt-3 rounded-lg" asChild>
                  <Link href="/dashboards">Open dashboards</Link>
                </Button>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-4 w-4 text-muted-foreground" />
                Pipeline distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
                View pipeline boards for stage distribution
              </div>
              {pipelines.length > 0 && (
                <Button variant="outline" size="sm" className="mt-3 rounded-lg" asChild>
                  <Link href={`/pipelines/${pipelines[0].id}`}>Open pipeline</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Third row: Tables */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Recent activity
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="rounded-xl border border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                Recent records
              </CardTitle>
              {firstModuleId && (
                <Button variant="ghost" size="sm" className="rounded-lg" asChild>
                  <Link href={`/records/${firstModuleId}`}>View all</Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {recentRecords.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No records yet. Create a module or add records.
                </p>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  {recentRecords.slice(0, 5).map((r, i) => (
                    <Link
                      key={r.id}
                      href={`/record/${r.id}`}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-muted/60",
                        i < 4 && "border-b border-border"
                      )}
                    >
                      <span className="truncate text-foreground">
                        {String((r.values as Record<string, unknown>)?.["name"] ?? (r.values as Record<string, unknown>)?.["title"] ?? r.id)}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-border bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                Tasks {tasksDueToday.length > 0 ? `(${tasksDueToday.length} due today)` : ""}
              </CardTitle>
              <Button variant="ghost" size="sm" className="rounded-lg" asChild>
                <Link href="/tasks">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentTasks.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No tasks yet.
                </p>
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  {recentTasks.slice(0, 5).map((t, i) => (
                    <Link
                      key={t.id}
                      href={t.relatedRecordId ? `/record/${t.relatedRecordId}` : "/tasks"}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 text-sm transition-colors hover:bg-muted/60",
                        i < 4 && "border-b border-border"
                      )}
                    >
                      <span className="truncate text-foreground">{t.title ?? "Task"}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Fourth row: Quick actions */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Quick actions
        </h2>
        <Card className="rounded-xl border border-border bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button className="h-auto flex-col gap-2 rounded-lg py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-md hover:scale-[1.02]" asChild>
                <Link href="/modules/new">
                  <Plus className="h-5 w-5" />
                  Create module
                </Link>
              </Button>
              <Button className="h-auto flex-col gap-2 rounded-lg py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-md hover:scale-[1.02]" asChild>
                <Link href="/templates">
                  <LayoutTemplate className="h-5 w-5" />
                  Install template
                </Link>
              </Button>
              <Button className="h-auto flex-col gap-2 rounded-lg py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-md hover:scale-[1.02]" asChild>
                <Link href={firstModuleId ? `/records/${firstModuleId}/import` : "/modules"}>
                  <Upload className="h-5 w-5" />
                  Import data
                </Link>
              </Button>
              <Button className="h-auto flex-col gap-2 rounded-lg py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:shadow-md hover:scale-[1.02]" asChild>
                <Link href="/pipelines/new">
                  <GitBranch className="h-5 w-5" />
                  Create pipeline
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Empty state */}
      {isEmpty && (
        <Card className="rounded-xl border-2 border-dashed border-border bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
              <LayoutTemplate className="h-7 w-7 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-lg font-semibold mb-1 text-foreground">Get started with Applyn CRM</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Install a template to create modules, pipelines, and dashboards in one step—then customize everything.
            </p>
            <Button asChild className="rounded-lg">
              <Link href="/templates">
                <Plus className="h-4 w-4 mr-2" />
                Choose a template
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick start when already set up */}
      {!isEmpty && (
        <Card className="rounded-xl border bg-card shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Quick start</CardTitle>
            <p className="text-sm text-muted-foreground">
              Create modules, add fields, and manage records. Use pipelines for stages and automations for workflows.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" className="rounded-lg">
                <Link href="/modules">
                  <Plus className="h-4 w-4 mr-2" />
                  Modules
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg" asChild>
                <Link href="/pipelines">Pipelines</Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg" asChild>
                <Link href="/dashboards">Dashboards</Link>
              </Button>
              {firstModuleId && (
                <Button variant="outline" size="sm" className="rounded-lg" asChild>
                  <Link href={`/records/${firstModuleId}`}>View records</Link>
                </Button>
              )}
              <Button variant="outline" size="sm" className="rounded-lg" asChild>
                <Link href="/tasks">Tasks</Link>
              </Button>
              <Button variant="outline" size="sm" className="rounded-lg" asChild>
                <Link href="/automations">Automations</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
