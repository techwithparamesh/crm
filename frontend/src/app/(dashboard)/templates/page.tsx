"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { crmTemplatesApi, type CrmTemplateItem, type TemplateInstallProgressEvent } from "@/lib/api";
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

const STEP_LABELS: Record<string, string> = {
  modules: "Installing modules",
  fields: "Creating fields",
  pipelines: "Setting pipelines",
  dashboards: "Preparing dashboards",
  views: "Creating views",
  roles: "Creating roles",
  relationships: "Creating relationships",
  done: "Complete",
  error: "Error",
};

function TemplateIcon({ icon }: { icon: string | null }) {
  const Icon = icon ? ICON_MAP[icon] ?? LayoutTemplate : LayoutTemplate;
  return <Icon className="h-10 w-10 text-muted-foreground" />;
}

export default function TemplatesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [installingTemplate, setInstallingTemplate] = useState<CrmTemplateItem | null>(null);
  const [installProgress, setInstallProgress] = useState<TemplateInstallProgressEvent | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["crm-templates"],
    queryFn: () => crmTemplatesApi.list(),
  });

  const handleInstall = async (t: CrmTemplateItem) => {
    setInstallingTemplate(t);
    setInstallProgress(null);
    setInstallError(null);
    try {
      await crmTemplatesApi.installWithProgress(t.id, (event) => {
        setInstallProgress(event);
      });
      queryClient.invalidateQueries({ queryKey: ["module"] });
      queryClient.invalidateQueries({ queryKey: ["modules"] });
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["dashboards"] });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setTimeout(() => {
        setInstallingTemplate(null);
        router.push("/dashboard");
      }, 800);
    } catch (err) {
      setInstallError(err instanceof Error ? err.message : "Install failed");
    }
  };

  const closeInstallModal = () => {
    if (installProgress?.done || installError) {
      setInstallingTemplate(null);
      setInstallProgress(null);
      setInstallError(null);
      if (installProgress?.done) router.push("/dashboard");
    }
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
          const installing = installingTemplate?.id === t.id;
          const installed = installing && installProgress?.done;
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
                  disabled={!!installingTemplate}
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      {installingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeInstallModal}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Installing {installingTemplate.name}</CardTitle>
              <CardDescription>
                {installProgress?.done ? "Template installed. Redirecting…" : "Setting up modules, fields, pipelines and dashboards…"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {["modules", "fields", "pipelines", "dashboards"].map((step) => {
                const isActive = installProgress?.step === step;
                const isPast = installProgress?.done || (
                  (step === "modules" && (installProgress?.step === "fields" || installProgress?.step === "pipelines" || installProgress?.step === "dashboards" || installProgress?.step === "done")) ||
                  (step === "fields" && (installProgress?.step === "pipelines" || installProgress?.step === "dashboards" || installProgress?.step === "done")) ||
                  (step === "pipelines" && (installProgress?.step === "dashboards" || installProgress?.step === "done")) ||
                  (step === "dashboards" && installProgress?.step === "done")
                );
                return (
                  <div key={step} className="flex items-center gap-3 text-sm">
                    {isPast ? (
                      <Check className="h-5 w-5 shrink-0 text-green-600" />
                    ) : isActive ? (
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" />
                    ) : (
                      <div className="h-5 w-5 shrink-0 rounded-full border-2 border-muted" />
                    )}
                    <span className={isPast ? "text-muted-foreground" : isActive ? "font-medium" : ""}>
                      {STEP_LABELS[step] ?? step}
                      {isActive && installProgress?.total != null && installProgress.total > 0 && (
                        <span className="ml-2 text-muted-foreground">
                          ({installProgress.current ?? 0}/{installProgress.total})
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
              {installError && (
                <p className="text-sm text-destructive mt-2">{installError}</p>
              )}
              {(installProgress?.done || installError) && (
                <Button className="w-full mt-4" onClick={closeInstallModal}>
                  {installProgress?.done ? "Go to dashboard" : "Close"}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

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
