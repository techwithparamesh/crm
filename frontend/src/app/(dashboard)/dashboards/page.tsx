"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dashboardsApi, roleDashboardsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Dashboard } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Plus, Pencil, Trash2, LayoutDashboard, ArrowRight } from "lucide-react";

export default function DashboardsListPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [roleDashboard, setRoleDashboard] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const refresh = () => dashboardsApi.list().then(setDashboards).catch(() => setDashboards([]));
  useEffect(() => {
    Promise.all([
      dashboardsApi.list().then(setDashboards).catch(() => setDashboards([])),
      roleDashboardsApi.getForMe().then((r) => setRoleDashboard(r.dashboard ?? null)).catch(() => setRoleDashboard(null)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleEdit = async (e: React.MouseEvent, d: Dashboard) => {
    e.preventDefault();
    e.stopPropagation();
    if (actionId) return;
    const name = window.prompt("Rename dashboard", d.name);
    if (name == null || name.trim() === "" || name.trim() === d.name) return;
    setActionId(d.id);
    try {
      await dashboardsApi.update(d.id, { name: name.trim() });
      setDashboards((prev) => prev.map((x) => (x.id === d.id ? { ...x, name: name.trim() } : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to rename");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, d: Dashboard) => {
    e.preventDefault();
    e.stopPropagation();
    if (actionId) return;
    if (!confirm(`Delete dashboard "${d.name}"? This will remove all its widgets.`)) return;
    setActionId(d.id);
    try {
      await dashboardsApi.delete(d.id);
      setDashboards((prev) => prev.filter((x) => x.id !== d.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Dashboards</h1>
        {/* Only show header action when we have dashboards; empty state has its own primary CTA */}
        {!loading && dashboards.length > 0 && (
          <Button asChild>
            <Link href="/dashboards/new">
              <Plus className="h-4 w-4 mr-2" />
              New dashboard
            </Link>
          </Button>
        )}
      </div>

      {/* Role-based "Your dashboard" — visible when your role has an assigned dashboard */}
      {!loading && roleDashboard && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <LayoutDashboard className="h-5 w-5" />
              Your dashboard
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              This dashboard is assigned to your role. Open it to see your metrics and reports.
            </p>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/dashboards/${roleDashboard.id}`}>
                {roleDashboard.name}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        </div>
      ) : dashboards.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="h-12 w-12 text-muted-foreground" />}
          title="No dashboards yet"
          description="Create a dashboard and add metric cards, charts, and tables. Or install an industry template (Templates) to get pre-built dashboards and role-based access."
          action={
            <div className="flex flex-wrap gap-2 justify-center">
              <Button asChild>
                <Link href="/dashboards/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/templates">Browse templates</Link>
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((d) => (
            <Card key={d.id} className="hover:bg-muted/50 transition-colors relative group">
              <Link href={`/dashboards/${d.id}`} className="block">
                <CardHeader className="flex flex-row items-center justify-between pb-2 pr-12">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    {d.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Open to add and configure widgets</p>
                </CardContent>
              </Link>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEdit(e, d)} title="Rename" disabled={actionId !== null}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => handleDelete(e, d)} title="Delete" disabled={actionId !== null}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
