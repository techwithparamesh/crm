/**
 * Web forms: CRUD, public config for embed, form submit (create record + submission), analytics.
 */

import { prisma } from "../../prisma/client.js";
import { mergeWhere } from "../../utils/tenantScopedRepository.js";
import { createLeadFromPayload } from "../lead-capture/lead-capture.service.js";
import type { CreateFormInput, UpdateFormInput } from "./forms.validation.js";

export async function createForm(tenantId: string, input: CreateFormInput) {
  const module = await prisma.module.findFirst({
    where: mergeWhere(tenantId, { id: input.moduleId }),
  });
  if (!module) throw new Error("Module not found");
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

export async function updateForm(tenantId: string, id: string, input: UpdateFormInput) {
  await prisma.webForm.findFirstOrThrow({
    where: mergeWhere(tenantId, { id }),
  });
  return prisma.webForm.update({
    where: { id },
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

export async function getFormById(tenantId: string, id: string) {
  const form = await prisma.webForm.findFirst({
    where: mergeWhere(tenantId, { id }),
    include: { module: { select: { id: true, name: true, slug: true } } },
  });
  if (!form) throw new Error("Form not found");
  return form;
}

/** Public: get form config for embed (no auth). Only returns active forms. */
export async function getFormConfigPublic(formId: string): Promise<{
  id: string;
  formName: string;
  fields: Array<{ fieldKey: string; type: string; required?: boolean; label?: string }>;
  redirectUrl: string | null;
  successMessage: string | null;
  recaptchaEnabled: boolean;
  recaptchaSiteKey: string | null;
} | null> {
  const form = await prisma.webForm.findFirst({
    where: { id: formId, isActive: true },
    select: {
      id: true,
      formName: true,
      fieldsJSON: true,
      redirectUrl: true,
      successMessage: true,
      recaptchaEnabled: true,
    },
  });
  if (!form) return null;
  let fields: Array<{ fieldKey: string; type: string; required?: boolean; label?: string }> = [];
  try {
    fields = JSON.parse(form.fieldsJSON) as typeof fields;
  } catch {
    // ignore
  }
  const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY ?? null;
  return {
    id: form.id,
    formName: form.formName,
    fields,
    redirectUrl: form.redirectUrl,
    successMessage: form.successMessage,
    recaptchaEnabled: form.recaptchaEnabled,
    recaptchaSiteKey: form.recaptchaEnabled ? recaptchaSiteKey : null,
  };
}

/** Record a form view (increment viewCount). Call from embed script when form is displayed. */
export async function recordFormView(formId: string): Promise<void> {
  await prisma.webForm.updateMany({
    where: { id: formId, isActive: true },
    data: { viewCount: { increment: 1 } },
  });
}

/** Submit form: create CRM record, store submission, fire automations. */
export async function submitForm(
  formId: string,
  values: Record<string, unknown>,
  options: { sourceIP?: string | null; userAgent?: string | null; recaptchaToken?: string | null }
): Promise<{ recordId: string; submissionId: string; redirectUrl?: string; successMessage?: string }> {
  const form = await prisma.webForm.findFirst({
    where: { id: formId, isActive: true },
    include: { module: true },
  });
  if (!form) throw new Error("Form not found or inactive");

  if (form.recaptchaEnabled && process.env.RECAPTCHA_SECRET_KEY) {
    const valid = await verifyRecaptcha(options.recaptchaToken);
    if (!valid) throw new Error("reCAPTCHA verification failed");
  }

  const result = await createLeadFromPayload(form.tenantId, form.moduleId, values, {
    formId: form.id,
    sourceIP: options.sourceIP ?? null,
    userAgent: options.userAgent ?? null,
    createdBy: null,
  });

  return {
    recordId: result.recordId,
    submissionId: result.submissionId!,
    redirectUrl: form.redirectUrl ?? undefined,
    successMessage: form.successMessage ?? undefined,
  };
}

async function verifyRecaptcha(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // skip if not configured
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return !!data.success;
  } catch {
    return false;
  }
}

export async function listSubmissions(tenantId: string, formId: string, limit = 100) {
  await prisma.webForm.findFirstOrThrow({
    where: mergeWhere(tenantId, { id: formId }),
  });
  return prisma.formSubmission.findMany({
    where: { formId, tenantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { record: { select: { id: true, createdAt: true } } },
  });
}

/** Analytics: views, submissions, conversion rate for a form. */
export async function getFormAnalytics(tenantId: string, formId: string) {
  const form = await prisma.webForm.findFirst({
    where: mergeWhere(tenantId, { id: formId }),
    select: { viewCount: true, _count: { select: { submissions: true } } },
  });
  if (!form) throw new Error("Form not found");
  const submissions = form._count.submissions;
  const views = form.viewCount;
  const conversionRate = views > 0 ? Math.round((submissions / views) * 10000) / 100 : 0;
  return {
    views,
    submissions,
    conversionRate,
  };
}
