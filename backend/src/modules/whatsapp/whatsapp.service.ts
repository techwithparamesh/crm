/**
 * WhatsApp service: conversations, messages, templates; uses provider adapter and stores in DB.
 */

import { prisma } from "../../prisma/client.js";
import { getWhatsAppProvider } from "./providers/index.js";
import { mergeWhere } from "../../utils/tenantScopedRepository.js";
import { logActivity } from "../activity-log/activity-log.service.js";

const PROVIDER_NAME = process.env.WHATSAPP_PROVIDER ?? "meta";

function getProvider() {
  const p = getWhatsAppProvider();
  if (!p) throw new Error("WhatsApp provider not configured");
  return p;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^0/, "");
}

export async function getOrCreateConversation(
  tenantId: string,
  phoneNumber: string,
  recordId?: string | null
) {
  const normalized = normalizePhone(phoneNumber);
  let conv = await prisma.whatsAppConversation.findFirst({
    where: { tenantId, phoneNumber: normalized },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  if (!conv) {
    conv = await prisma.whatsAppConversation.create({
      data: {
        tenantId,
        phoneNumber: normalized,
        recordId: recordId ?? undefined,
        status: "open",
      },
      include: { messages: true },
    });
  } else if (recordId && conv.recordId !== recordId) {
    conv = await prisma.whatsAppConversation.update({
      where: { id: conv.id },
      data: { recordId },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 50 } },
    });
  }
  return conv;
}

export async function sendMessage(
  tenantId: string,
  phoneNumber: string,
  messageBody: string,
  options: { recordId?: string | null; conversationId?: string | null } = {}
): Promise<{ messageId: string; conversationId: string; providerMessageId: string }> {
  const provider = getProvider();
  const normalized = normalizePhone(phoneNumber);

  let conversation = options.conversationId
    ? await prisma.whatsAppConversation.findFirst({
        where: mergeWhere(tenantId, { id: options.conversationId }),
      })
    : null;
  if (!conversation) {
    conversation = await getOrCreateConversation(tenantId, normalized, options.recordId);
  }

  const result = await provider.sendMessage(normalized, messageBody);

  const message = await prisma.whatsAppMessage.create({
    data: {
      tenantId,
      conversationId: conversation.id,
      recordId: options.recordId ?? conversation.recordId,
      phoneNumber: normalized,
      messageBody,
      direction: "outbound",
      status: result.status,
      providerMessageId: result.providerMessageId,
      provider: PROVIDER_NAME,
    },
  });

  if (options.recordId) {
    logActivity({
      tenantId,
      recordId: options.recordId,
      userId: null,
      eventType: "note_added",
      metadata: { type: "whatsapp_sent", messageId: message.id },
    }).catch(() => {});
  }

  return {
    messageId: message.id,
    conversationId: conversation.id,
    providerMessageId: result.providerMessageId,
  };
}

export async function sendTemplate(
  tenantId: string,
  phoneNumber: string,
  templateId: string,
  variables: Record<string, string>,
  options: { recordId?: string | null; conversationId?: string | null } = {}
): Promise<{ messageId: string; conversationId: string; providerMessageId: string }> {
  const template = await prisma.whatsAppTemplate.findFirst({
    where: mergeWhere(tenantId, { id: templateId }),
  });
  if (!template) throw new Error("Template not found");

  const provider = getProvider();
  const templateName = template.providerTemplateId || template.name;
  const result = await provider.sendTemplate(phoneNumber, templateName, variables);

  let conversation = options.conversationId
    ? await prisma.whatsAppConversation.findFirst({
        where: mergeWhere(tenantId, { id: options.conversationId }),
      })
    : null;
  if (!conversation) {
    conversation = await getOrCreateConversation(tenantId, normalizePhone(phoneNumber), options.recordId);
  }
  const body = replaceTemplateVariables(template.templateBody, variables);

  const message = await prisma.whatsAppMessage.create({
    data: {
      tenantId,
      conversationId: conversation.id,
      recordId: options.recordId ?? conversation.recordId,
      phoneNumber: normalizePhone(phoneNumber),
      messageBody: body,
      direction: "outbound",
      status: result.status,
      providerMessageId: result.providerMessageId,
      provider: PROVIDER_NAME,
    },
  });

  if (options.recordId) {
    logActivity({
      tenantId,
      recordId: options.recordId,
      userId: null,
      eventType: "note_added",
      metadata: { type: "whatsapp_template_sent", messageId: message.id },
    }).catch(() => {});
  }

  return {
    messageId: message.id,
    conversationId: conversation.id,
    providerMessageId: result.providerMessageId,
  };
}

function replaceTemplateVariables(body: string, variables: Record<string, string>): string {
  let out = body;
  for (const [key, value] of Object.entries(variables)) {
    out = out.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi"), value);
  }
  return out.replace(/\{\{\s*\w+\s*\}\}/g, "");
}

export async function listConversations(tenantId: string, recordId?: string | null) {
  const where = mergeWhere(tenantId, recordId ? { recordId } : {});
  return prisma.whatsAppConversation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function listMessages(tenantId: string, conversationId: string, limit = 100) {
  return prisma.whatsAppMessage.findMany({
    where: mergeWhere(tenantId, { conversationId }),
    orderBy: { createdAt: "asc" },
    take: limit,
  });
}

export async function listMessagesByRecord(tenantId: string, recordId: string) {
  const convos = await prisma.whatsAppConversation.findMany({
    where: mergeWhere(tenantId, { recordId }),
    select: { id: true },
  });
  const ids = convos.map((c) => c.id);
  if (ids.length === 0) return [];
  return prisma.whatsAppMessage.findMany({
    where: { conversationId: { in: ids }, tenantId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createTemplate(
  tenantId: string,
  data: { name: string; templateBody: string; variablesJSON?: string | null; providerTemplateId?: string | null }
) {
  return prisma.whatsAppTemplate.create({
    data: {
      tenantId,
      name: data.name,
      templateBody: data.templateBody,
      variablesJSON: data.variablesJSON ?? null,
      providerTemplateId: data.providerTemplateId ?? null,
    },
  });
}

export async function listTemplates(tenantId: string) {
  return prisma.whatsAppTemplate.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
  });
}

export async function getTemplateById(tenantId: string, id: string) {
  const t = await prisma.whatsAppTemplate.findFirst({
    where: mergeWhere(tenantId, { id }),
  });
  if (!t) throw new Error("Template not found");
  return t;
}

export async function storeInboundMessage(
  tenantId: string,
  phoneNumber: string,
  messageBody: string,
  providerMessageId: string | null,
  recordId?: string | null
) {
  const conversation = await getOrCreateConversation(tenantId, phoneNumber, recordId);
  return prisma.whatsAppMessage.create({
    data: {
      tenantId,
      conversationId: conversation.id,
      recordId: recordId ?? conversation.recordId,
      phoneNumber: normalizePhone(phoneNumber),
      messageBody,
      direction: "inbound",
      status: "delivered",
      providerMessageId,
      provider: PROVIDER_NAME,
    },
  });
}

export async function updateMessageStatus(
  tenantId: string,
  providerMessageId: string,
  status: string
) {
  await prisma.whatsAppMessage.updateMany({
    where: { tenantId, providerMessageId },
    data: { status },
  });
}

export async function broadcastTemplate(
  tenantId: string,
  templateId: string,
  recipients: Array<{ phoneNumber: string; variables: Record<string, string>; recordId?: string | null }>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    try {
      await sendTemplate(tenantId, r.phoneNumber, templateId, r.variables, { recordId: r.recordId });
      sent++;
    } catch {
      failed++;
    }
  }
  return { sent, failed };
}
