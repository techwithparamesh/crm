"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { pipelinesApi, modulesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function NewPipelinePage() {
  const router = useRouter();
  const [modules, setModules] = useState<{ id: string; name: string }[]>([]);
  const [moduleId, setModuleId] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    modulesApi.list().then(setModules).catch(() => setModules([]));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Pipeline name is required");
      return;
    }
    if (!moduleId) {
      setError("Select a module");
      return;
    }
    setSaving(true);
    try {
      const pipeline = await pipelinesApi.create({ moduleId, name: name.trim() });
      router.push(`/pipelines/${pipeline.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create pipeline");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pipelines">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New pipeline</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create a pipeline for a module</CardTitle>
          <p className="text-sm text-muted-foreground">Pipelines let you manage records in stages (e.g. Lead → Qualified → Won).</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="module">Module</Label>
              <select
                id="module"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a module</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              {modules.length === 0 && <p className="text-xs text-muted-foreground mt-1">No modules yet. Create one under Modules first.</p>}
            </div>
            <div>
              <Label htmlFor="name">Pipeline name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sales pipeline"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={saving || !moduleId}>{saving ? "Creating…" : "Create pipeline"}</Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/pipelines">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
