"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { pipelinesApi, modulesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PipelineWithStages } from "@/lib/api";
import type { Module } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { GitBranch, Plus, Pencil, Trash2 } from "lucide-react";

export default function PipelinesPage() {
  const [pipelines, setPipelines] = useState<PipelineWithStages[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const refresh = () =>
    Promise.all([pipelinesApi.list(), modulesApi.list()]).then(([p, m]) => {
      setPipelines(p);
      setModules(m);
    });
  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const handleEdit = async (e: React.MouseEvent, p: PipelineWithStages) => {
    e.preventDefault();
    e.stopPropagation();
    if (actionId) return;
    const name = window.prompt("Rename pipeline", p.name);
    if (name == null || name.trim() === "" || name.trim() === p.name) return;
    setActionId(p.id);
    try {
      await pipelinesApi.update(p.id, { name: name.trim() });
      setPipelines((prev) => prev.map((x) => (x.id === p.id ? { ...x, name: name.trim() } : x)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to rename");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, p: PipelineWithStages) => {
    e.preventDefault();
    e.stopPropagation();
    if (actionId) return;
    if (!confirm(`Delete pipeline "${p.name}"? All stages will be removed. Records in this pipeline will have their stage cleared.`)) return;
    setActionId(p.id);
    try {
      await pipelinesApi.delete(p.id);
      setPipelines((prev) => prev.filter((x) => x.id !== p.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Pipelines</h1>
        {!loading && pipelines.length > 0 && (
          <Button asChild>
            <Link href="/pipelines/new">
              <Plus className="h-4 w-4 mr-2" />
              New pipeline
            </Link>
          </Button>
        )}
      </div>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      ) : pipelines.length === 0 ? (
        <EmptyState
          icon={<GitBranch className="h-12 w-12 text-muted-foreground" />}
          title="No pipelines yet"
          description="Create a pipeline for a module to move records through stages (e.g. Lead → Qualified → Won)."
          action={
            <Button asChild>
              <Link href="/pipelines/new">
                <Plus className="h-4 w-4 mr-2" />
                Create pipeline
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pipelines.map((p) => (
            <Card key={p.id} className="relative group">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pr-24">
                <CardTitle className="text-base flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  {p.name}
                </CardTitle>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEdit(e, p)} title="Rename" disabled={actionId !== null}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => handleDelete(e, p)} title="Delete" disabled={actionId !== null}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{p.module?.name ?? p.moduleId}</p>
                <p className="text-xs text-muted-foreground mt-2">{p.stages?.length ?? 0} stages</p>
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link href={`/pipelines/${p.id}`}>View & manage stages</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
