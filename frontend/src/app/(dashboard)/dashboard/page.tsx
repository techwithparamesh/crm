"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { modulesApi, dashboardsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ModuleWithCount } from "@/lib/api";
import { Layers, Plus } from "lucide-react";

export default function DashboardPage() {
  const [modules, setModules] = useState<ModuleWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([modulesApi.list(), dashboardsApi.list()])
      .then(([mods]) => { setModules(mods); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Modules</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{loading ? "…" : modules.length}</p>
            <p className="text-xs text-muted-foreground">Configured modules</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Quick start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">Create modules, add fields, and start managing records. Use pipelines for stages and automations for workflows.</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild size="sm" className="sm:size-default">
              <Link href="/modules">
                <Plus className="h-4 w-4 mr-2" />
                Modules
              </Link>
            </Button>
            <Button variant="outline" asChild size="sm" className="sm:size-default">
              <Link href="/pipelines">Pipelines</Link>
            </Button>
            <Button variant="outline" asChild size="sm" className="sm:size-default">
              <Link href="/tasks">Tasks</Link>
            </Button>
            <Button variant="outline" asChild size="sm" className="sm:size-default">
              <Link href="/automations">Automations</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
