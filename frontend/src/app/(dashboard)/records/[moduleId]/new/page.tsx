"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { modulesApi, recordsApi } from "@/lib/api";
import { DynamicFormRenderer, buildDefaultValues } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ModuleWithFields } from "@/lib/api";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewRecordPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.moduleId as string;
  const [moduleData, setModuleData] = useState<ModuleWithFields | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    modulesApi.get(moduleId).then(setModuleData).catch(() => setModuleData(null));
  }, [moduleId]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    setError("");
    setSubmitting(true);
    try {
      const record = await recordsApi.create({ moduleId, values });
      router.push(`/record/${record.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create record");
    } finally {
      setSubmitting(false);
    }
  };

  if (!moduleData) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/records/${moduleId}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h1 className="text-2xl font-bold">New {moduleData.name} record</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          <DynamicFormRenderer
            key={moduleId}
            fields={moduleData.fields}
            defaultValues={buildDefaultValues(moduleData.fields)}
            onSubmit={handleSubmit}
            submitLabel="Create"
            layout="grid"
            isSubmitting={submitting}
            footer={
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
