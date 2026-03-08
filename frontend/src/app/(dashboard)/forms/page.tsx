"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WebFormListItem } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FileInput, Plus } from "lucide-react";

export default function FormsPage() {
  const [forms, setForms] = useState<WebFormListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    formsApi.list().then(setForms).catch(() => setForms([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lead capture forms</h1>
        {!loading && forms.length > 0 && (
          <Button asChild>
            <Link href="/forms/new">
              <Plus className="h-4 w-4 mr-2" />
              New form
            </Link>
          </Button>
        )}
      </div>
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        </div>
      ) : forms.length === 0 ? (
        <EmptyState
          icon={<FileInput className="h-12 w-12 text-muted-foreground" />}
          title="No forms yet"
          description="Create a form to capture leads from your website or landing pages and add them to your CRM."
          action={
            <Button asChild>
              <Link href="/forms/new">
                <Plus className="h-4 w-4 mr-2" />
                Create form
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((f) => (
            <Link key={f.id} href={`/forms/${f.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileInput className="h-4 w-4" />
                    {f.formName}
                  </CardTitle>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      f.isActive ? "bg-green-500/20 text-green-700" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {f.isActive ? "Active" : "Inactive"}
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {f.module?.name ?? "Module"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {f.viewCount} views · {(f as WebFormListItem & { _count?: { submissions: number } })._count?.submissions ?? 0} submissions
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
