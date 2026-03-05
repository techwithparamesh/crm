/**
 * WhatsApp webhook: inbound messages and delivery status.
 * Provider-specific payload parsing (Meta, Twilio, 360Dialog).
 * Expects req.body to be Buffer (use express.raw for this route).
 */

import { Request, Response } from "express";
import * as whatsappService from "./whatsapp.service.js";
import { verifyWebhookSignature, getWebhookSecret } from "./webhook.verify.js";

const PROVIDER = (process.env.WHATSAPP_PROVIDER ?? "meta").toLowerCase();

function getBody(req: Request): unknown {
  const raw = req.body;
  if (Buffer.isBuffer(raw)) {
    try {
      return JSON.parse(raw.toString("utf8")) as unknown;
    } catch {
      return {};
    }
  }
  return (raw as unknown) ?? {};
}

export async function handleWebhook(req: Request, res: Response): Promise<void> {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {}));
  const signature =
    (req.headers["x-hub-signature-256"] as string) ??
    (req.headers["x-twilio-signature"] as string) ??
    (req.headers["x-360dialog-signature"] as string);
  const secret = getWebhookSecret();
  if (secret && !verifyWebhookSignature(rawBody, signature, secret)) {
    res.status(401).send("Invalid signature");
    return;
  }

  const body = getBody(req) as { object?: string; entry?: Array<{ changes?: Array<{ value?: unknown }> }>; Body?: string; From?: string; MessageSid?: string; message?: { from: string; id?: string; text?: { body?: string } }; status?: { id: string; status: string } };

  if (PROVIDER === "meta") {
    if (body?.object === "whatsapp_business_account" && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        const value = entry.changes?.[0]?.value;
        if (value && typeof value === "object") {
          const v = value as Record<string, unknown>;
          if (v.messages) {
            const messages = v.messages as Array<{
              from: string;
              id?: string;
              text?: { body?: string };
              type?: string;
            }>;
            const tenantId = process.env.WHATSAPP_TENANT_ID ?? "";
            if (tenantId) {
              for (const msg of messages) {
                const from = String(msg.from || "").replace(/\D/g, "");
                const bodyText = msg.text?.body ?? (msg.type === "text" ? "" : "[non-text]");
                if (bodyText) {
                  await whatsappService
                    .storeInboundMessage(tenantId, from, bodyText, msg.id ?? null, undefined)
                    .catch(() => {});
                }
              }
            }
          }
          if (v.statuses) {
            const statuses = v.statuses as Array<{ id: string; status: string }>;
            const tenantId = process.env.WHATSAPP_TENANT_ID ?? "";
            if (tenantId) {
              for (const s of statuses) {
                await whatsappService
                  .updateMessageStatus(tenantId, s.id, s.status)
                  .catch(() => {});
              }
            }
          }
        }
      }
    }
  }

  if (PROVIDER === "twilio") {
    const Body = body?.Body as string | undefined;
    const From = body?.From as string | undefined;
    const MessageSid = body?.MessageSid as string | undefined;
    if (Body && From) {
      const tenantId = process.env.WHATSAPP_TENANT_ID ?? "";
      const from = From.replace("whatsapp:", "").replace(/\D/g, "");
      if (tenantId) {
        await whatsappService
          .storeInboundMessage(tenantId, from, Body, MessageSid ?? null, undefined)
          .catch(() => {});
      }
    }
  }

  if (PROVIDER === "dialog") {
    const payload = body;
    const tenantId = process.env.WHATSAPP_TENANT_ID ?? "";
    if (tenantId && payload?.message) {
      const from = String(payload.message.from ?? "").replace(/\D/g, "");
      const bodyText = payload.message.text?.body ?? "";
      if (bodyText) {
        await whatsappService
          .storeInboundMessage(tenantId, from, bodyText, payload.message.id ?? null, undefined)
          .catch(() => {});
      }
    }
    if (tenantId && payload?.status) {
      await whatsappService
        .updateMessageStatus(tenantId, payload.status.id, payload.status.status)
        .catch(() => {});
    }
  }

  res.status(200).send("OK");
}
