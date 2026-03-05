"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { crmTemplatesApi, type CrmTemplateItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CreditCard,
  Home,
  Megaphone,
  HeartPulse,
  LayoutTemplate,
  Loader2,
  Check,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "credit-card": CreditCard,
  home: Home,
  megaphone: Megaphone,
  "heart-pulse": HeartPulse,
};

function TemplateIcon({ icon }: { icon: string | null }) {
  const Icon = icon ? ICON_MAP[icon] ?? LayoutTemplate : LayoutTemplate;
  return <Icon className="h-10 w-10 text-muted-foreground" />;
}

export default function TemplatesPage() {
  const queryClient = useQueryClient();
  const { data: templates, isLoading } = useQuery({
    queryKey: ["crm-templates"],
    queryFn: () => crmTemplatesApi.list(),
  });

  const installMutation = useMutation({
    mutationFn: (templateId: string) => crmTemplatesApi.install(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["module"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const handleInstall = (t: CrmTemplateItem) => {
    installMutation.mutate(t.id, {
      onSuccess: () => {
        installMutation.reset();
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CRM Templates</h1>
        <p className="text-muted-foreground mt-1">
          Install pre-built templates for your industry. Modules, fields, pipelines, dashboards and roles will be created for your workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {(templates ?? []).map((t) => {
          const installing = installMutation.isPending && installMutation.variables === t.id;
          const installed = installMutation.isSuccess && installMutation.variables === t.id;
          return (
            <Card key={t.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <TemplateIcon icon={t.icon} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg truncate">{t.name}</CardTitle>
                  </div>
                </div>
                {t.description && (
                  <CardDescription className="line-clamp-2 mt-1">
                    {t.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="mt-auto pt-4">
                <Button
                  className="w-full"
                  onClick={() => handleInstall(t)}
                  disabled={installing || installed}
                >
                  {installing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Installing…
                    </>
                  ) : installed ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Installed
                    </>
                  ) : (
                    "Install template"
                  )}
                </Button>
                {installMutation.isError && installMutation.variables === t.id && (
                  <p className="text-sm text-destructive mt-2">
                    {installMutation.error instanceof Error
                      ? installMutation.error.message
                      : "Install failed"}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {templates?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No templates available. Run the backend seed to add Loan, Real Estate, Marketing and Clinic templates.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
