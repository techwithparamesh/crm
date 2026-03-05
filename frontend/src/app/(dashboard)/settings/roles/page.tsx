"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { rolesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/api";
import { Shield, Plus } from "lucide-react";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rolesApi.list().then(setRoles).catch(() => setRoles([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roles & permissions</h1>
        <Button asChild>
          <Link href="/settings/roles/new">
            <Plus className="h-4 w-4 mr-2" />
            New role
          </Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Control module access, record visibility (all vs own), and edit/delete per role. Permissions are stored as JSON.
      </p>
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : roles.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No roles yet. Create one and set permissions JSON (modules, recordVisibility, manageModules).</p>
            <Button asChild className="mt-4">
              <Link href="/settings/roles/new">Create role</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((r) => (
            <Link key={r.id} href={`/settings/roles/${r.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {r.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {(r as Role & { _count?: { users: number } })._count?.users ?? 0} user(s)
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
