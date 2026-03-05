"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { rolesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

const DEFAULT_PERMISSIONS = JSON.stringify(
  {
    modules: {},
    recordVisibility: "all",
    manageModules: false,
  },
  null,
 2
);

export default function NewRolePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [permissionsJSON, setPermissionsJSON] = useState(DEFAULT_PERMISSIONS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    try {
      JSON.parse(permissionsJSON);
    } catch {
      setError("Invalid JSON in permissions");
      return;
    }
    setSaving(true);
    try {
      const role = await rolesApi.create({ name: name.trim(), permissionsJSON });
      router.push(`/settings/roles/${role.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/settings/roles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New role</h1>
      </div>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <Label htmlFor="name">Role name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sales" />
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
          <p className="text-xs text-muted-foreground mt-1">
            Example: &#123; &quot;modules&quot;: &#123; &quot;moduleId&quot;: &#123; &quot;view&quot;: true, &quot;create&quot;: true, &quot;edit&quot;: true, &quot;delete&quot;: false &#125; &#125;, &quot;recordVisibility&quot;: &quot;all&quot; | &quot;own&quot;, &quot;manageModules&quot;: true &#125;
          </p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create"}</Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/settings/roles">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
