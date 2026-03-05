"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { automationsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Automation } from "@/lib/api";
import { Workflow, Plus } from "lucide-react";

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    automationsApi.list().then(setAutomations).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Automations</h1>
        <Button asChild>
          <Link href="/automations/new">
            <Plus className="h-4 w-4 mr-2" />
            New automation
          </Link>
        </Button>
      </div>
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">No automations yet. Create workflows that trigger on record create/update or stage change.</p>
            <Button asChild className="mt-4">
              <Link href="/automations/new">Create automation</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {automations.map((a) => (
            <Link key={a.id} href={`/automations/${a.id}`}>
              <Card className="hover:bg-muted/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Workflow className="h-4 w-4" />
                    {a.name ?? a.triggerType}
                  </CardTitle>
                  <span className={`text-xs px-2 py-0.5 rounded ${a.isActive ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                    {a.isActive ? "Active" : "Inactive"}
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Trigger: {a.triggerType.replace(/_/g, " ")}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
