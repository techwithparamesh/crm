"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { modulesApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { canManageModules } from "@/lib/permissions";
import { getModuleDescription, getModuleGroup } from "@/lib/module-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OnboardingPanel } from "@/components/ui/onboarding-panel";
import { CardGridSkeleton } from "@/components/ui/skeleton-loaders";
import type { ModuleWithCount } from "@/lib/api";
import { Plus, Layers, Trash2, Pencil, FolderOpen, LayoutTemplate, Upload } from "lucide-react";

function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return d.toLocaleDateString();
}

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const canCreate = canManageModules(user?.permissions ?? null);

  const refresh = () => {
    setError(null);
    return modulesApi
      .list()
      .then(setModules)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load modules"));
  };
  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Delete module "${name}"? This will remove all its records and fields.`)) return;
    try {
      await modulesApi.delete(id);
      setModules((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete module");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Modules</h1>
        {canCreate && !loading && modules.length > 0 && (
          <Button asChild>
            <Link href="/modules/new">
              <Plus className="h-4 w-4 mr-2" />
              New module
            </Link>
          </Button>
        )}
      </div>
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-destructive font-medium">Could not load modules</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Start the backend with: <code className="bg-muted px-1 rounded">cd backend && npm run dev</code>
            </p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => { setError(null); setLoading(true); refresh().finally(() => setLoading(false)); }}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}
      {!error && loading ? (
        <CardGridSkeleton count={6} />
      ) : !error && modules.length === 0 ? (
        <OnboardingPanel
          icon={<Layers className="h-7 w-7" />}
          title="Get started with Applyn CRM"
          description="Install a template to get pre-built modules and fields, or create your own module from scratch. You can also import data later."
          actions={
            <>
              <Button asChild className="rounded-lg">
                <Link href="/templates">
                  <LayoutTemplate className="h-4 w-4 mr-2" />
                  Install template
                </Link>
              </Button>
              {canCreate && (
                <Button variant="outline" asChild className="rounded-lg">
                  <Link href="/modules/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create module
                  </Link>
                </Button>
              )}
              <Button variant="outline" asChild className="rounded-lg">
                <Link href="/modules">
                  <Upload className="h-4 w-4 mr-2" />
                  Import data
                </Link>
              </Button>
            </>
          }
        />
      ) : !error ? (
        <>
          <p className="text-sm text-muted-foreground">Open a module to view records, add fields, or manage settings. Descriptions help you see what each module is for.</p>
          {(() => {
            const journey = modules.filter((m) => getModuleGroup(m.slug) === "journey");
            const process = modules.filter((m) => getModuleGroup(m.slug) === "process");
            const other = modules.filter((m) => !getModuleGroup(m.slug));
            const hasGroups = journey.length > 0 || process.length > 0;
            return (
              <div className="space-y-8">
                {hasGroups && journey.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Loan journey</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {journey.map((m) => (
                        <ModuleCard key={m.id} m={m} canCreate={canCreate} onDelete={handleDelete} />
                      ))}
                    </div>
                  </div>
                )}
                {hasGroups && process.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Process & compliance</h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {process.map((m) => (
                        <ModuleCard key={m.id} m={m} canCreate={canCreate} onDelete={handleDelete} />
                      ))}
                    </div>
                  </div>
                )}
                {(other.length > 0 || !hasGroups) && (
                  <div>
                    {hasGroups && <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Other modules</h2>}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {(hasGroups ? other : modules).map((m) => (
                        <ModuleCard key={m.id} m={m} canCreate={canCreate} onDelete={handleDelete} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      ) : null}
    </div>
  );
}

function ModuleCard({
  m,
  canCreate,
  onDelete,
}: {
  m: ModuleWithCount;
  canCreate: boolean;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}) {
  return (
    <Card
      className="rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md relative group"
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pr-12">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold truncate">{m.name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{m.slug}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2" title={getModuleDescription(m)}>
              {getModuleDescription(m)}
            </p>
          </div>
        </div>
        {canCreate && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
            onClick={(e) => onDelete(e, m.id, m.name)}
            title="Delete module"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{(m as ModuleWithCount)._count?.records ?? 0} records</span>
          <span>{(m as ModuleWithCount)._count?.fields ?? 0} fields</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Last updated {formatRelativeTime(m.updatedAt)}
        </p>
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="rounded-lg flex-1" asChild>
            <Link href={`/modules/${m.id}`}>
              <FolderOpen className="h-3.5 w-3.5 mr-1.5" />
              Open module
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="rounded-lg" asChild>
            <Link href={`/modules/${m.id}`}>
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
