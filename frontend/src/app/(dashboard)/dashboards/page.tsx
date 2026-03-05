"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dashboardsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Dashboard } from "@/lib/api";
import { BarChart3, Plus } from "lucide-react";

export default function DashboardsListPage() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardsApi.list().then(setDashboards).catch(() => setDashboards([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboards</h1>
        <Button asChild>
          <Link href="/dashboards/new">
            <Plus className="h-4 w-4 mr-2" />
            New dashboard
          </Link>
        </Button>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : dashboards.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No dashboards yet. Create one and add metric cards, charts, and tables.</p>
            <Button asChild className="mt-4">
              <Link href="/dashboards/new">Create dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dashboards.map((d) => (
            <Link key={d.id} href={`/dashboards/${d.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    {d.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Open to add and configure widgets</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
