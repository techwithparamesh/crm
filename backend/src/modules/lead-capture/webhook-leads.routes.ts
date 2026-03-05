/**
 * POST /webhooks/leads — inbound lead capture from Zapier, n8n, Facebook Lead Ads, etc.
 * Tenant resolved via X-API-Key (CRM API token). Body: moduleId (or default Leads module), then any field key/values.
 */

import { Request, Response } from "express";
import { webhookLeadsSchema } from "./forms.validation.js";
import { createLeadFromPayload } from "./lead-create.service.js";
import { resolveTenantByApiKey } from "./webhook-leads.service.js";
import { resolveModuleBySlug } from "./webhook-leads.service.js";

const DEFAULT_LEADS_MODULE_SLUG = "leads";

export async function handleWebhookLeads(req: Request, res: Response): Promise<void> {
  const apiKey =
    (req.headers["x-api-key"] as string)?.trim() ??
    (req.body?.apiKey as string)?.trim();
  const tenantIdFromKey = apiKey ? await resolveTenantByApiKey(apiKey) : null;

  const parsed = webhookLeadsSchema.safeParse(req.body);
  const body = parsed.success ? parsed.data : (req.body as Record<string, unknown>) || {};
  const tenantIdBody = body.tenantId as string | undefined;
  const tenantId = tenantIdFromKey ?? tenantIdBody;
  if (!tenantId) {
    res.status(401).json({ error: "Missing API key (X-API-Key header or apiKey in body) or tenantId" });
    return;
  }

  let moduleId = body.moduleId as string | undefined;
  if (!moduleId) {
    const resolved = await resolveModuleBySlug(tenantId, DEFAULT_LEADS_MODULE_SLUG);
    if (!resolved) {
      res.status(400).json({ error: "moduleId required or create a module with slug 'leads'" });
      return;
    }
    moduleId = resolved;
  }

  const payload = { ...body };
  delete payload.tenantId;
  delete payload.apiKey;
  delete payload.moduleId;

  try {
    const { recordId } = await createLeadFromPayload(
      tenantId,
      moduleId,
      payload,
      (body.source as string) || "webhook"
    );
    res.status(201).json({ recordId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lead creation failed";
    res.status(400).json({ error: message });
  }
}
