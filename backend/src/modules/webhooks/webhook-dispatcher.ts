import crypto from "crypto";
import { prisma } from "../../prisma/client.js";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

export interface WebhookPayload {
  event: string;
  module?: string;
  moduleId?: string;
  recordId: string;
  tenantId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

async function deliverWithRetry(url: string, payload: WebhookPayload, secretKey: string | null): Promise<void> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Webhook-Event": payload.event,
    "X-Webhook-Timestamp": payload.timestamp,
  };
  if (secretKey) {
    headers["X-Webhook-Signature"] = signPayload(body, secretKey);
  }

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return;
      lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
    }
    if (attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    }
  }
  console.error(`[webhook] Failed after ${MAX_RETRIES} attempts: ${url}`, lastError);
}

export async function dispatchWebhooks(
  tenantId: string,
  eventType: string,
  payload: Omit<WebhookPayload, "event" | "timestamp"> & { event?: string }
): Promise<void> {
  const fullPayload: WebhookPayload = {
    ...payload,
    event: payload.event ?? eventType,
    timestamp: new Date().toISOString(),
  };

  const webhooks = await prisma.webhook.findMany({
    where: { tenantId, eventType, isActive: true },
  });

  await Promise.all(
    webhooks.map((w) => deliverWithRetry(w.targetUrl, fullPayload, w.secretKey).catch(() => {}))
  );
}
