/**
 * Create CRM record from external payload (webhook, Facebook Lead Ads, etc.).
 * Maps payload keys to module fields and creates record.
 */

import { prisma } from "../../prisma/client.js";
import { createRecord } from "../records/records.service.js";
import { mergeWhere } from "../../utils/tenantScopedRepository.js";

/** Normalize common payload keys (e.g. from webhooks) to possible field keys. */
const COMMON_FIELD_ALIASES: Record<string, string[]> = {
  name: ["name", "full_name", "fullName", "contact_name"],
  email: ["email", "email_address"],
  phone: ["phone", "phone_number", "mobile", "tel"],
  company: ["company", "company_name", "organization"],
  source: ["source", "lead_source", "utm_source"],
};

function mapPayloadToValues(
  payload: Record<string, unknown>,
  moduleFieldKeys: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const usedKeys = new Set<string>();

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === "") continue;
    const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, "_");
    if (moduleFieldKeys.some((f) => f.toLowerCase() === normalizedKey)) {
      const match = moduleFieldKeys.find((f) => f.toLowerCase() === normalizedKey);
      if (match && !usedKeys.has(match)) {
        result[match] = value;
        usedKeys.add(match);
      }
    }
  }

  for (const [canonical, aliases] of Object.entries(COMMON_FIELD_ALIASES)) {
    if (result[canonical] != null) continue;
    for (const alias of aliases) {
      const val = payload[alias] ?? payload[alias.replace(/_/g, "")];
      if (val !== undefined && val !== null && val !== "") {
        if (moduleFieldKeys.some((f) => f.toLowerCase() === canonical)) {
          const match = moduleFieldKeys.find((f) => f.toLowerCase() === canonical);
          if (match) result[match] = val;
        }
        break;
      }
    }
  }

  return result;
}

/**
 * Create a CRM record from a generic lead payload (e.g. POST /webhooks/leads).
 * Resolves tenant by tenantId (from API key lookup or body).
 */
export async function createLeadFromPayload(
  tenantId: string,
  moduleId: string,
  payload: Record<string, unknown>,
  _source?: string
): Promise<{ recordId: string }> {
  const module = await prisma.module.findFirst({
    where: mergeWhere(tenantId, { id: moduleId }),
    include: { fields: { orderBy: { orderIndex: "asc" } } },
  });
  if (!module) throw new Error("Module not found");

  const fieldKeys = module.fields.map((f) => f.fieldKey);
  const values = mapPayloadToValues(payload, fieldKeys);

  const record = await createRecord(
    tenantId,
    moduleId,
    null,
    { values },
    undefined
  );

  return { recordId: record.id };
}
