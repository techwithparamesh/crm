"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  apiTokensApi,
  webhooksApi,
  type ApiTokenListItem,
  type ApiTokenCreated,
  type Webhook,
  type WebhookEventType,
  WEBHOOK_EVENT_TYPES,
} from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function IntegrationsPage() {
  const { tenant } = useAuthStore();
  const [tokens, setTokens] = useState<ApiTokenListItem[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // API Token create form
  const [newTokenName, setNewTokenName] = useState("");
  const [createdToken, setCreatedToken] = useState<ApiTokenCreated | null>(null);
  const [creatingToken, setCreatingToken] = useState(false);

  // Webhook create form
  const [newWebhookEvent, setNewWebhookEvent] = useState<WebhookEventType>("record_created");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookSecret, setNewWebhookSecret] = useState("");
  const [creatingWebhook, setCreatingWebhook] = useState(false);

  const load = () => {
    setError("");
    Promise.all([apiTokensApi.list(), webhooksApi.list()])
      .then(([t, w]) => {
        setTokens(t);
        setWebhooks(w);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) return;
    setCreatingToken(true);
    setError("");
    try {
      const result = await apiTokensApi.create({ name: newTokenName.trim() });
      setCreatedToken(result);
      setNewTokenName("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create token");
    } finally {
      setCreatingToken(false);
    }
  };

  const handleCopyToken = () => {
    if (createdToken?.token) {
      navigator.clipboard.writeText(createdToken.token);
    }
  };

  const handleDismissToken = () => {
    setCreatedToken(null);
  };

  const handleDeleteToken = async (id: string) => {
    try {
      await apiTokensApi.delete(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete token");
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookUrl.trim()) return;
    setCreatingWebhook(true);
    setError("");
    try {
      await webhooksApi.create({
        eventType: newWebhookEvent,
        targetUrl: newWebhookUrl.trim(),
        secretKey: newWebhookSecret.trim() || null,
        isActive: true,
      });
      setNewWebhookUrl("");
      setNewWebhookSecret("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create webhook");
    } finally {
      setCreatingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await webhooksApi.delete(id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete webhook");
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/settings">← Back</Link>
        </Button>
        <h1 className="text-2xl font-bold">Integrations</h1>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* API Tokens */}
      <Card>
        <CardHeader>
          <CardTitle>API Tokens</CardTitle>
          <p className="text-sm text-muted-foreground">
            Use tokens to authenticate external systems (e.g. n8n, Zapier). Use the token in the Authorization header: <code className="bg-muted px-1 rounded">Bearer &lt;token&gt;</code>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {createdToken && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 space-y-2">
              <p className="text-sm font-medium">Token created. Copy it now — it won&apos;t be shown again.</p>
              <div className="flex gap-2">
                <Input readOnly value={createdToken.token} className="font-mono text-sm" />
                <Button variant="outline" size="sm" onClick={handleCopyToken}>Copy</Button>
                <Button variant="ghost" size="sm" onClick={handleDismissToken}>Dismiss</Button>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="sr-only">Token name</Label>
              <Input placeholder="e.g. n8n integration" value={newTokenName} onChange={(e) => setNewTokenName(e.target.value)} />
            </div>
            <Button onClick={handleCreateToken} disabled={creatingToken || !newTokenName.trim()}>
              {creatingToken ? "Creating…" : "Create token"}
            </Button>
          </div>
          <ul className="space-y-2">
            {tokens.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded border px-3 py-2">
                <div>
                  <span className="font-medium">{t.name}</span>
                  <span className="text-muted-foreground text-sm ml-2">
                    Created {new Date(t.createdAt).toLocaleDateString()}
                    {t.lastUsedAt && ` · Last used ${new Date(t.lastUsedAt).toLocaleString()}`}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteToken(t.id)}>
                  Delete
                </Button>
              </li>
            ))}
            {tokens.length === 0 && !createdToken && <li className="text-sm text-muted-foreground">No API tokens yet.</li>}
          </ul>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Webhooks</CardTitle>
          <p className="text-sm text-muted-foreground">
            We send a POST request to your URL when events occur. Failed deliveries are retried up to 3 times. Optionally set a secret to verify payloads with X-Webhook-Signature (HMAC-SHA256).
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div>
              <Label>Event</Label>
              <select
                className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newWebhookEvent}
                onChange={(e) => setNewWebhookEvent(e.target.value as WebhookEventType)}
              >
                {WEBHOOK_EVENT_TYPES.map((ev) => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Target URL</Label>
              <Input placeholder="https://your-server.com/webhook" value={newWebhookUrl} onChange={(e) => setNewWebhookUrl(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label>Secret key (optional)</Label>
            <Input placeholder="For X-Webhook-Signature verification" value={newWebhookSecret} onChange={(e) => setNewWebhookSecret(e.target.value)} className="mt-1" />
          </div>
          <Button onClick={handleCreateWebhook} disabled={creatingWebhook || !newWebhookUrl.trim()}>
            {creatingWebhook ? "Adding…" : "Add webhook"}
          </Button>
          <ul className="space-y-2">
            {webhooks.map((w) => (
              <li key={w.id} className="flex items-center justify-between rounded border px-3 py-2">
                <div>
                  <span className="font-medium">{w.eventType}</span>
                  <span className="text-muted-foreground text-sm ml-2 break-all">{w.targetUrl}</span>
                  {!w.isActive && <span className="ml-2 text-amber-600 text-sm">(inactive)</span>}
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteWebhook(w.id)}>
                  Delete
                </Button>
              </li>
            ))}
            {webhooks.length === 0 && <li className="text-sm text-muted-foreground">No webhooks yet.</li>}
          </ul>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
          <p className="text-sm text-muted-foreground">Examples for n8n and external API usage.</p>
        </CardHeader>
        <CardContent className="space-y-6 text-sm">
          <div>
            <h3 className="font-semibold mb-2">External request: Create a record</h3>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
{`POST ${API_BASE || "https://your-api.com"}/records
Authorization: Bearer <your_api_token>
Content-Type: application/json

{
  "moduleId": "<module_id>",
  "values": { "name": "New Lead", "email": "lead@example.com" },
  "pipelineStageId": "<stage_id>"  // optional
}`}
            </pre>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Webhook payload example</h3>
            <p className="text-muted-foreground mb-2">Your endpoint receives POST with:</p>
            <pre className="bg-muted p-4 rounded-md overflow-x-auto">
{`{
  "event": "record_created",
  "module": "leads",
  "moduleId": "...",
  "recordId": "clx...",
  "tenantId": "${tenant?.id ?? "..."}",
  "data": { "name": "...", "email": "..." },
  "timestamp": "2025-03-04T12:00:00.000Z"
}`}
            </pre>
            <p className="text-muted-foreground mt-2">
              Headers: <code className="bg-muted px-1 rounded">X-Webhook-Event</code>, <code className="bg-muted px-1 rounded">X-Webhook-Timestamp</code>, and optionally <code className="bg-muted px-1 rounded">X-Webhook-Signature</code> (HMAC-SHA256 of body when secret is set).
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">n8n workflow: Webhook trigger → Create CRM record</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Add a <strong>Webhook</strong> node (Trigger) and copy the production URL.</li>
              <li>In this CRM, add a webhook above with that URL and event e.g. <code className="bg-muted px-1 rounded">record_created</code>.</li>
              <li>When a record is created, n8n receives the payload. Add an <strong>HTTP Request</strong> node to create another record: method POST, URL <code className="bg-muted px-1 rounded">{API_BASE || "https://api"}/records</code>, Auth = Header, name <code className="bg-muted px-1 rounded">Authorization</code>, value <code className="bg-muted px-1 rounded">Bearer {'{{ $env.CRM_API_TOKEN }}'}</code>, body JSON with <code className="bg-muted px-1 rounded">moduleId</code> and <code className="bg-muted px-1 rounded">values</code>.</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
