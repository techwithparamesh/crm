"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { rolesApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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
        {!loading && roles.length > 0 && (
          <Button asChild>
            <Link href="/settings/roles/new">
              <Plus className="h-4 w-4 mr-2" />
              New role
            </Link>
          </Button>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Control module access, record visibility (all vs own), and edit/delete per role. Permissions are stored as JSON.
      </p>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      ) : roles.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-12 w-12 text-muted-foreground" />}
          title="No roles yet"
          description="Create a role and set permissions (modules, record visibility, manage modules). Templates can also create roles when you install them."
          action={
            <Button asChild>
              <Link href="/settings/roles/new">
                <Plus className="h-4 w-4 mr-2" />
                Create role
              </Link>
            </Button>
          }
        />
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
