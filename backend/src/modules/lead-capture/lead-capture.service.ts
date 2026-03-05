/**
 * Lead capture: create CRM records from form submissions, webhooks, Facebook Lead Ads.
 * Maps payload to module fields and calls record creation + automation.
 */

import { prisma } from "../../prisma/client.js";
import { createRecord } from "../records/records.service.js";
import { mergeWhere } from "../../utils/tenantScopedRepository.js";
import type { CreateLeadFromPayloadOptions } from "./lead-capture.types.js";

/** Normalize payload keys (e.g. snake_case to fieldKey). */
function mapPayloadToFieldValues(
  payload: Record<string, unknown>,
  moduleFieldKeys: string[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lowerMap = new Map<string, string>();
  moduleFieldKeys.forEach((k) => lowerMap.set(k.toLowerCase().replace(/_/g, ""), k));
  moduleFieldKeys.forEach((k) => lowerMap.set(k, k));

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === "") continue;
    const normalized = key.replace(/\s+/g, "_").toLowerCase().replace(/-/g, "_");
    const fieldKey = lowerMap.get(normalized) ?? moduleFieldKeys.find((f) => f.toLowerCase() === key) ?? key;
    if (moduleFieldKeys.includes(fieldKey) || moduleFieldKeys.length === 0) {
      result[fieldKey] = value;
    }
  }
  return result;
}

/**
 * Create a CRM record from a lead payload (form, webhook, Facebook, etc.).
 * Optionally stores FormSubmission and fires record_created automations.
 */
export async function createLeadFromPayload(
  tenantId: string,
  moduleId: string,
  payload: Record<string, unknown>,
  options: CreateLeadFromPayloadOptions = {}
): Promise<{ recordId: string; submissionId?: string }> {
  const module = await prisma.module.findFirst({
    where: mergeWhere(tenantId, { id: moduleId }),
    include: { fields: { orderBy: { orderIndex: "asc" } } },
  });
  if (!module) throw new Error("Module not found");

  const fieldKeys = module.fields.map((f) => f.fieldKey);
  const values = mapPayloadToFieldValues(payload, fieldKeys);

  const record = await createRecord(
    tenantId,
    moduleId,
    options.createdBy ?? null,
    { values }
    // No permission context: internal/service call
  );

  if (options.formId) {
    const form = await prisma.webForm.findFirst({
      where: mergeWhere(tenantId, { id: options.formId }),
    });
    if (form) {
      const sub = await prisma.formSubmission.create({
        data: {
          tenantId,
          formId: options.formId,
          recordId: record.id,
          payloadJSON: JSON.stringify(payload),
          sourceIP: options.sourceIP ?? null,
          userAgent: options.userAgent ?? null,
        },
      });
      return { recordId: record.id, submissionId: sub.id };
    }
  }

  return { recordId: record.id };
}
