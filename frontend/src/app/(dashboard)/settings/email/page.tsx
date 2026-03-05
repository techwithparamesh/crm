"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { emailApi, type SmtpConfigResponse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmailSettingsPage() {
  const [config, setConfig] = useState<SmtpConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState(587);
  const [secure, setSecure] = useState(false);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [fromName, setFromName] = useState("");

  useEffect(() => {
    emailApi
      .getSmtp()
      .then((c) => {
        setConfig(c);
        if (c && "host" in c && c.host) {
          setHost(c.host);
          setPort(c.port ?? 587);
          setSecure(c.secure ?? false);
          setUser(c.user ?? "");
          setFromEmail(c.fromEmail ?? "");
          setFromName(c.fromName ?? "");
        }
      })
      .catch(() => setConfig({ configured: false }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!host.trim() || !user.trim() || !fromEmail.trim()) {
      setError("Host, user, and from email are required");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await emailApi.updateSmtp({
        host: host.trim(),
        port,
        secure,
        user: user.trim(),
        ...(password ? { password } : {}),
        fromEmail: fromEmail.trim(),
        fromName: fromName.trim() || null,
      });
      setPassword("");
      const updated = await emailApi.getSmtp();
      setConfig(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save SMTP config");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/settings">← Back</Link>
        </Button>
        <h1 className="text-2xl font-bold">Email (SMTP)</h1>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Card>
        <CardHeader>
          <CardTitle>SMTP configuration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure outgoing email for this tenant. Used when sending email from the CRM and for automation send_email actions.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Host</Label>
              <Input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="smtp.example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Port</Label>
              <Input
                type="number"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value, 10) || 587)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="secure"
              checked={secure}
              onChange={(e) => setSecure(e.target.checked)}
            />
            <Label htmlFor="secure">Use TLS (secure)</Label>
          </div>
          <div>
            <Label>Username</Label>
            <Input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="smtp@example.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={config?.configured ? "Leave blank to keep current" : "SMTP password"}
              className="mt-1"
            />
          </div>
          <div>
            <Label>From email</Label>
            <Input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="noreply@example.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label>From name (optional)</Label>
            <Input
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="My CRM"
              className="mt-1"
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
