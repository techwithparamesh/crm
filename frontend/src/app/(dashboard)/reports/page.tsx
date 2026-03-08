"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Analytics and reporting for your workspace. Use dashboards for KPIs and charts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <FileBarChart className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <CardTitle>Reports & analytics</CardTitle>
              <CardDescription>
                Build custom reports from your modules and pipelines. For now, use Dashboards to create metric cards, charts, and time series from your record data.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboards">Open Dashboards</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/modules">View modules</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
