"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { modulesApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  name: z.string().min(1, "Name required"),
  slug: z.string().min(1).regex(/^[a-z0-9_-]+$/, "Lowercase letters, numbers, _ and - only"),
  icon: z.string().optional(),
  description: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function NewModulePage() {
  const [error, setError] = useState("");
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "", icon: "folder", description: "" },
  });

  const onSubmit = async (data: Form) => {
    setError("");
    try {
      const mod = await modulesApi.create({ name: data.name, slug: data.slug, icon: data.icon, description: data.description ?? undefined });
      router.push(`/modules/${mod.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    }
  };

  return (
    <div className="max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>New module</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive mb-4">{error}</p>}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input {...register("name")} placeholder="e.g. Leads" className="mt-1" />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label>Slug (URL-friendly)</Label>
              <Input {...register("slug")} placeholder="leads" className="mt-1" />
              {errors.slug && <p className="text-xs text-destructive mt-1">{errors.slug.message}</p>}
            </div>
            <div>
              <Label>Icon (optional)</Label>
              <Input {...register("icon")} placeholder="folder" className="mt-1" />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input {...register("description")} className="mt-1" />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Create</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
