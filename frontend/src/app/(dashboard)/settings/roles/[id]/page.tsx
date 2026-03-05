"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { rolesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Role } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

export default function EditRolePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [permissionsJSON, setPermissionsJSON] = useState("{}");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    rolesApi.get(id).then((r) => {
      setRole(r);
      setName(r.name);
      setPermissionsJSON(r.permissionsJSON ? (() => { try { return JSON.stringify(JSON.parse(r.permissionsJSON!), null, 2); } catch { return r.permissionsJSON!; } })() : "{}");
    }).catch(() => setRole(null)).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      JSON.parse(permissionsJSON);
    } catch {
      setError("Invalid JSON in permissions");
      return;
    }
    setSaving(true);
    try {
      await rolesApi.update(id, { name: name.trim(), permissionsJSON });
      setRole((p) => (p ? { ...p, name: name.trim(), permissionsJSON } : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this role? Users with this role will have no role.")) return;
    try {
      await rolesApi.delete(id);
      router.push("/settings/roles");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading…</p>;
  if (!role) return <p className="text-destructive">Role not found.</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings/roles">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Edit role</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDelete}>Delete</Button>
      </div>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <Label htmlFor="name">Role name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="perm">Permissions (JSON)</Label>
          <textarea
            id="perm"
            value={permissionsJSON}
            onChange={(e) => setPermissionsJSON(e.target.value)}
            className="w-full min-h-[200px] rounded border border-input bg-background px-3 py-2 font-mono text-sm"
            spellCheck={false}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/settings/roles">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
