"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function SettingsPage() {
  const { user, tenant } = useAuthStore();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href="/settings/roles">Roles & permissions</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/settings/branding">Branding & white label</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/settings/integrations">Integrations (API & webhooks)</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/settings/email">Email (SMTP)</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/settings/billing">Billing</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Tenant name</Label>
            <Input value={tenant?.name ?? ""} readOnly className="mt-1 bg-muted" />
          </div>
          <div>
            <Label>Tenant ID (use this to sign in from another device)</Label>
            <Input value={tenant?.id ?? ""} readOnly className="mt-1 font-mono text-sm bg-muted" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={user?.name ?? ""} readOnly className="mt-1 bg-muted" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user?.email ?? ""} readOnly className="mt-1 bg-muted" />
          </div>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">Manage API tokens and webhooks under Integrations. Billing and audit logs are placeholders for future SaaS features.</p>
    </div>
  );
}
