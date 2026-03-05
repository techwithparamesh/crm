/**
 * Lead capture: web forms CRUD, form config for embed, form submit (create record + submission + automation).
 */

import { prisma } from "../../prisma/client.js";
import { createRecord } from "../records/records.service.js";
import { mergeWhere } from "../../utils/tenantScopedRepository.js";
import type { FormFieldConfig, FormConfigPublic } from "./lead-capture.types.js";

export type CreateFormInput = {
  moduleId: string;
  formName: string;
  fieldsJSON: string;
  redirectUrl?: string | null;
  successMessage?: string | null;
  isActive?: boolean;
  recaptchaEnabled?: boolean;
  autoAssignUserId?: string | null;
};

export type UpdateFormInput = Partial<CreateFormInput>;

export async function createForm(tenantId: string, input: CreateFormInput) {
  return prisma.webForm.create({
    data: {
      tenantId,
      moduleId: input.moduleId,
      formName: input.formName,
      fieldsJSON: input.fieldsJSON,
      redirectUrl: input.redirectUrl ?? null,
      successMessage: input.successMessage ?? null,
      isActive: input.isActive ?? true,
      recaptchaEnabled: input.recaptchaEnabled ?? false,
      autoAssignUserId: input.autoAssignUserId ?? null,
    },
  });
}

export async function updateForm(tenantId: string, formId: string, input: UpdateFormInput) {
  await prisma.webForm.findFirstOrThrow({
    where: mergeWhere(tenantId, { id: formId }),
  });
  return prisma.webForm.update({
    where: { id: formId },
    data: {
      ...(input.moduleId != null && { moduleId: input.moduleId }),
      ...(input.formName != null && { formName: input.formName }),
      ...(input.fieldsJSON != null && { fieldsJSON: input.fieldsJSON }),
      ...(input.redirectUrl !== undefined && { redirectUrl: input.redirectUrl }),
      ...(input.successMessage !== undefined && { successMessage: input.successMessage }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.recaptchaEnabled !== undefined && { recaptchaEnabled: input.recaptchaEnabled }),
      ...(input.autoAssignUserId !== undefined && { autoAssignUserId: input.autoAssignUserId }),
    },
  });
}

export async function listForms(tenantId: string) {
  return prisma.webForm.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    include: {
      module: { select: { id: true, name: true, slug: true } },
      _count: { select: { submissions: true } },
    },
  });
}

export async function getFormById(tenantId: string, formId: string) {
  const form = await prisma.webForm.findFirst({
    where: mergeWhere(tenantId, { id: formId }),
    include: { module: true },
  });
  if (!form) throw new Error("Form not found");
  return form;
}

/** Public config for embed script: no auth, form must be active. */
export async function getFormConfigPublic(formId: string): Promise<FormConfigPublic | null> {
  const form = await prisma.webForm.findFirst({
    where: { id: formId, isActive: true },
  });
  if (!form) return null;
  let fields: FormFieldConfig[] = [];
  try {
    fields = JSON.parse(form.fieldsJSON) as FormFieldConfig[];
  } catch {
    // ignore
  }
  const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY ?? null;
  return {
    formId: form.id,
    formName: form.formName,
    fields,
    redirectUrl: form.redirectUrl,
    successMessage: form.successMessage,
    recaptchaEnabled: form.recaptchaEnabled,
    recaptchaSiteKey: form.recaptchaEnabled ? recaptchaSiteKey : null,
  };
}

/** Increment view count (e.g. when embed loads config). */
export async function incrementFormViewCount(formId: string): Promise<void> {
  await prisma.webForm.updateMany({
    where: { id: formId, isActive: true },
    data: { viewCount: { increment: 1 } },
  });
}

export async function submitForm(
  formId: string,
  payload: Record<string, unknown>,
  options: { sourceIP?: string; userAgent?: string }
): Promise<{ recordId: string; redirectUrl: string | null; successMessage: string | null }> {
  const form = await prisma.webForm.findFirst({
    where: { id: formId, isActive: true },
    include: { module: { include: { fields: { orderBy: { orderIndex: "asc" } } } } },
  });
  if (!form) throw new Error("Form not found or inactive");

  const tenantId = form.tenantId;
  const moduleId = form.moduleId;
  const createdBy = form.autoAssignUserId;

  const record = await createRecord(
    tenantId,
    moduleId,
    createdBy,
    { values: payload as Record<string, unknown> },
    undefined
  );

  await prisma.formSubmission.create({
    data: {
      tenantId,
      formId,
      recordId: record.id,
      payloadJSON: JSON.stringify(payload),
      sourceIP: options.sourceIP ?? null,
      userAgent: options.userAgent ?? null,
    },
  });

  await prisma.webForm.update({
    where: { id: formId },
    data: { viewCount: { increment: 0 } }, // no op for view; we could add submissionCount if we add the column
  });
  // If we had submissionCount: data: { submissionCount: { increment: 1 } }

  return {
    recordId: record.id,
    redirectUrl: form.redirectUrl,
    successMessage: form.successMessage,
  };
}

export async function listSubmissions(tenantId: string, formId: string, limit = 100) {
  return prisma.formSubmission.findMany({
    where: mergeWhere(tenantId, { formId }),
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { record: { select: { id: true, createdAt: true } } },
  });
}

export async function getFormAnalytics(tenantId: string, formId: string) {
  const form = await prisma.webForm.findFirst({
    where: mergeWhere(tenantId, { id: formId }),
    select: { viewCount: true },
  });
  if (!form) throw new Error("Form not found");
  const submissionCount = await prisma.formSubmission.count({
    where: { formId, tenantId },
  });
  const conversionRate =
    form.viewCount > 0 ? Math.round((submissionCount / form.viewCount) * 100) : 0;
  return {
    views: form.viewCount,
    submissions: submissionCount,
    conversionRate,
  };
}
