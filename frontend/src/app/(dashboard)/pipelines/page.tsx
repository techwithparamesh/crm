"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pipelinesApi, modulesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PipelineWithStages } from "@/lib/api";
import type { Module } from "@/lib/api";
import { GitBranch, Plus } from "lucide-react";

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<PipelineWithStages[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([pipelinesApi.list(), modulesApi.list()]).then(([p, m]) => {
      setPipelines(p);
      setModules(m);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pipelines</h1>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : pipelines.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No pipelines yet. Create a pipeline for a module to manage stages (e.g. sales pipeline).</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pipelines.map((p) => (
            <Card key={p.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  {p.name}
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/pipelines/${p.id}`}>View</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{p.module?.name ?? p.moduleId}</p>
                <p className="text-xs text-muted-foreground mt-2">{p.stages?.length ?? 0} stages</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
