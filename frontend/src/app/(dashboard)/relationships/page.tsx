"use client";

import { useEffect, useState } from "react";
import { relationshipsApi, modulesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { ModuleRelationship } from "@/lib/api";
import type { ModuleWithCount } from "@/lib/api";
import { Link2, Plus, Trash2 } from "lucide-react";

export default function RelationshipsPage() {
  const [list, setList] = useState<ModuleRelationship[]>([]);
  const [modules, setModules] = useState<ModuleWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [sourceModuleId, setSourceModuleId] = useState("");
  const [targetModuleId, setTargetModuleId] = useState("");
  const [relationshipType, setRelationshipType] = useState<"one_to_many" | "many_to_many">("one_to_many");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([relationshipsApi.list(), modulesApi.list()])
      .then(([rels, mods]) => {
        setList(rels);
        setModules(mods);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!sourceModuleId || !targetModuleId) {
      setError("Source and target modules are required");
      return;
    }
    if (sourceModuleId === targetModuleId) {
      setError("Source and target must be different modules");
      return;
    }
    setSubmitting(true);
    try {
      await relationshipsApi.create({
        name: name.trim(),
        sourceModuleId,
        targetModuleId,
        relationshipType,
      });
      setName("");
      setSourceModuleId("");
      setTargetModuleId("");
      setRelationshipType("one_to_many");
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create relationship");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this relationship? Existing links between records will be removed.")) return;
    try {
      await relationshipsApi.delete(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Link2 className="h-6 w-6" />
          Module relationships
        </h1>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-2" />
          New relationship
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create relationship</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div>
                <Label htmlFor="rel-name">Name (e.g. Deal Contacts)</Label>
                <Input
                  id="rel-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Deal Contacts"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="rel-source">Source module (one side in 1:N)</Label>
                <select
                  id="rel-source"
                  value={sourceModuleId}
                  onChange={(e) => setSourceModuleId(e.target.value)}
                  className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select module</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="rel-target">Target module (many side in 1:N)</Label>
                <select
                  id="rel-target"
                  value={targetModuleId}
                  onChange={(e) => setTargetModuleId(e.target.value)}
                  className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select module</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="rel-type">Type</Label>
                <select
                  id="rel-type"
                  value={relationshipType}
                  onChange={(e) => setRelationshipType(e.target.value as "one_to_many" | "many_to_many")}
                  className="mt-1 w-full rounded border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="one_to_many">One-to-many (e.g. one Deal, many Contacts)</option>
                  <option value="many_to_many">Many-to-many</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>Create</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : list.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No relationships yet. Create one to link records between modules (e.g. Deal → Contacts).
            </p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>Create relationship</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((rel) => (
            <Card key={rel.id}>
              <CardContent className="py-4 flex flex-row items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{rel.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {rel.sourceModule?.name ?? "—"}
                    {" → "}
                    {rel.targetModule?.name ?? "—"}
                    {" · "}
                    <span className="capitalize">{rel.relationshipType.replace("_", "-")}</span>
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(rel.id)} title="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
