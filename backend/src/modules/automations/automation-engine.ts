/**
 * Pluggable automation rule engine.
 * Evaluates conditions against context and runs actions.
 * Extend by registering new trigger/action handlers.
 */

import { prisma } from "../../prisma/client.js";
import { createNotification } from "../notifications/notifications.service.js";
import { sendEmail } from "../email/email.service.js";
import * as whatsappService from "../whatsapp/whatsapp.service.js";
import { areQueuesAvailable, whatsappSendQueue } from "../../queues/queues.js";
import type { Condition, Action } from "./automations.validation.js";

export interface AutomationContext {
  tenantId: string;
  moduleId?: string;
  recordId?: string;
  userId?: string;
  payload?: Record<string, unknown>; // trigger-specific (e.g. previousStageId, fieldChanges)
  recordValues?: Record<string, unknown>; // current record field values for action resolution
}

function evaluateCondition(condition: Condition, context: AutomationContext, recordValues?: Record<string, unknown>): boolean {
  const { field, operator, value } = condition;
  const actual = field ? recordValues?.[field] : undefined;
  switch (operator) {
    case "eq":
      return actual === value;
    case "neq":
      return actual !== value;
    case "contains":
      return typeof actual === "string" && typeof value === "string" && actual.includes(value);
    case "not_contains":
      return typeof actual !== "string" || typeof value !== "string" || !actual.includes(value);
    case "gt":
      return Number(actual) > Number(value);
    case "gte":
      return Number(actual) >= Number(value);
    case "lt":
      return Number(actual) < Number(value);
    case "lte":
      return Number(actual) <= Number(value);
    case "is_empty":
      return actual === undefined || actual === null || actual === "";
    case "is_not_empty":
      return actual !== undefined && actual !== null && actual !== "";
    default:
      return false;
  }
}

export function evaluateConditions(
  conditionsJSON: string | null | undefined,
  context: AutomationContext,
  recordValues?: Record<string, unknown>
): boolean {
  if (!conditionsJSON?.trim()) return true;
  let conditions: Condition[];
  try {
    conditions = JSON.parse(conditionsJSON) as Condition[];
  } catch {
    return false;
  }
  if (!Array.isArray(conditions) || conditions.length === 0) return true;
  return conditions.every((c) => evaluateCondition(c, context, recordValues));
}

export async function runActions(
  actionsJSON: string,
  context: AutomationContext
): Promise<void> {
  let actions: Action[];
  try {
    actions = JSON.parse(actionsJSON) as Action[];
  } catch {
    return;
  }
  if (!Array.isArray(actions)) return;
  for (const action of actions) {
    await runAction(action, context);
  }
}

async function runAction(action: Action, context: AutomationContext): Promise<void> {
  const params = (action.params ?? {}) as Record<string, unknown>;
  const recordValues = context.recordValues;
  switch (action.type) {
    case "create_task":
      await prisma.task.create({
        data: {
          tenantId: context.tenantId,
          relatedRecordId: context.recordId ?? undefined,
          assignedTo: (params.assignedTo as string) ?? undefined,
          title: (params.title as string) ?? "Auto-created task",
          description: (params.description as string) ?? undefined,
          dueDate: params.dueDate ? new Date(String(params.dueDate)) : undefined,
          status: "pending",
        },
      });
      break;
    case "send_email": {
      const to = String(params.to ?? "").trim();
      const subject = String(params.subject ?? "").trim() || "Message from CRM";
      const body = String(params.body ?? "").trim() || "";
      if (to) {
        await sendEmail(context.tenantId, {
          to,
          subject,
          body,
          recordId: context.recordId ?? null,
          userId: context.userId ?? null,
        });
      }
      break;
    }
    case "send_webhook":
      // Placeholder: HTTP POST to params.url with payload
      console.log("[Automation] send_webhook placeholder", params);
      break;
    case "send_whatsapp_message": {
      const templateId = params.templateId as string | undefined;
      const phoneField = (params.phoneField as string) ?? "phone";
      const phone = context.recordId && recordValues?.[phoneField] != null
        ? String(recordValues[phoneField])
        : (params.phone as string);
      if (!phone?.trim()) break;
      const variables = (params.variables as Record<string, string>) ?? {};
      const resolvedVars: Record<string, string> = {};
      for (const [k, v] of Object.entries(variables)) {
        const val = String(v ?? "");
        const match = val.match(/^\{\{\s*(\w+(?:\.\w+)*)\s*\}\}$/);
        resolvedVars[k] = match && recordValues?.[match[1]] != null
          ? String(recordValues[match[1]])
          : val;
      }
      if (templateId) {
        if (areQueuesAvailable() && whatsappSendQueue) {
          await (whatsappSendQueue as unknown as { add: (data: unknown) => Promise<unknown> }).add({
            tenantId: context.tenantId,
            phoneNumber: phone.trim(),
            type: "template",
            templateId,
            templateVariables: resolvedVars,
            recordId: context.recordId ?? null,
          });
        } else {
          await whatsappService.sendTemplate(
            context.tenantId,
            phone.trim(),
            templateId,
            resolvedVars,
            { recordId: context.recordId ?? null }
          );
        }
      } else {
        const body = (params.body as string) ?? "";
        if (areQueuesAvailable() && whatsappSendQueue) {
          await (whatsappSendQueue as unknown as { add: (data: unknown) => Promise<unknown> }).add({
            tenantId: context.tenantId,
            phoneNumber: phone.trim(),
            type: "text",
            body,
            recordId: context.recordId ?? null,
          });
        } else {
          await whatsappService.sendMessage(
            context.tenantId,
            phone.trim(),
            body,
            { recordId: context.recordId ?? null }
          );
        }
      }
      break;
    }
    case "update_field":
      if (context.recordId && params.fieldKey && params.value !== undefined) {
        const record = await prisma.record.findFirst({
          where: { id: context.recordId, tenantId: context.tenantId },
          include: { module: { include: { fields: true } } },
        });
        if (record) {
          const field = record.module.fields.find((f) => f.fieldKey === params.fieldKey);
          if (field) {
            const col =
              ["number", "currency"].includes(field.fieldType) ? "valueNumber" :
              field.fieldType === "date" ? "valueDate" :
              ["multi_select", "checkbox"].includes(field.fieldType) ? "valueJSON" : "valueText";
            const value = params.value;
            await prisma.recordValue.upsert({
              where: {
                recordId_fieldId: { recordId: context.recordId, fieldId: field.id },
              },
              create: {
                recordId: context.recordId,
                fieldId: field.id,
                ...(col === "valueText" && { valueText: String(value) }),
                ...(col === "valueNumber" && { valueNumber: Number(value) }),
                ...(col === "valueDate" && { valueDate: new Date(String(value)) }),
                ...(col === "valueJSON" && { valueJSON: JSON.stringify(value) }),
              },
              update: {
                ...(col === "valueText" && { valueText: String(value) }),
                ...(col === "valueNumber" && { valueNumber: Number(value) }),
                ...(col === "valueDate" && { valueDate: new Date(String(value)) }),
                ...(col === "valueJSON" && { valueJSON: JSON.stringify(value) }),
              },
            });
          }
        }
      }
      break;
    default:
      console.log("[Automation] Unknown action type", (action as Action).type);
  }
}

/** Fire automations for a trigger. Call from record create/update, stage change, task overdue job. */
export async function fireAutomations(
  triggerType: string,
  context: AutomationContext,
  recordValues?: Record<string, unknown>
): Promise<void> {
  const automations = await prisma.automation.findMany({
    where: {
      tenantId: context.tenantId,
      isActive: true,
      triggerType,
      ...(context.moduleId && { moduleId: context.moduleId }),
    },
  });
  for (const auto of automations) {
    const passes = evaluateConditions(auto.conditionsJSON, context, recordValues);
    if (passes) {
      await runActions(auto.actionsJSON, { ...context, recordValues });
      if (context.userId) {
        createNotification({
          tenantId: context.tenantId,
          userId: context.userId,
          type: "automation_triggered",
          title: "Automation ran",
          message: auto.name ?? `Automation (${triggerType})`,
          entityType: "automation",
          entityId: auto.id,
          metadataJSON: JSON.stringify({ triggerType, recordId: context.recordId }),
        }).catch(() => {});
      }
    }
  }
}
