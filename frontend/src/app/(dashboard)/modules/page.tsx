"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { modulesApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { canManageModules } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ModuleWithCount } from "@/lib/api";
import { Plus, Layers } from "lucide-react";

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const canCreate = canManageModules(user?.permissions ?? null);

  useEffect(() => {
    modulesApi.list().then(setModules).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Modules</h1>
        {canCreate && (
          <Button asChild>
            <Link href="/modules/new">
              <Plus className="h-4 w-4 mr-2" />
              New module
            </Link>
          </Button>
        )}
      </div>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : modules.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No modules yet. Create one to define entities (e.g. Leads, Deals, Contacts).</p>
            {canCreate && (
              <Button asChild className="mt-4">
                <Link href="/modules/new">Create module</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <Link key={m.id} href={`/modules/${m.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    {m.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{m.slug}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {(m as ModuleWithCount)._count?.records ?? 0} records · {(m as ModuleWithCount)._count?.fields ?? 0} fields
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
