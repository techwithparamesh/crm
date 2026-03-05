/**
 * Resolve tenant (and optionally module) from API key for inbound lead webhooks.
 */

import { prisma } from "../../prisma/client.js";
import { hashApiToken } from "../../utils/hashToken.js";

export async function resolveTenantByApiKey(apiKey: string): Promise<string | null> {
  if (!apiKey?.trim()) return null;
  const hash = hashApiToken(apiKey.trim());
  const token = await prisma.apiToken.findFirst({
    where: { tokenHash: hash },
    select: { tenantId: true },
  });
  return token?.tenantId ?? null;
}

export async function resolveModuleBySlug(tenantId: string, slug: string): Promise<string | null> {
  const mod = await prisma.module.findFirst({
    where: { tenantId, slug },
    select: { id: true },
  });
  return mod?.id ?? null;
}
