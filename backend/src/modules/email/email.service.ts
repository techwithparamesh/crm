import nodemailer from "nodemailer";
import { prisma } from "../../prisma/client.js";
import { logActivity } from "../activity-log/activity-log.service.js";

export interface SmtpConfigInput {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password?: string;
  fromEmail: string;
  fromName?: string | null;
}

export async function getSmtpConfig(tenantId: string) {
  const config = await prisma.smtpConfig.findUnique({
    where: { tenantId },
  });
  if (!config) return null;
  return {
    id: config.id,
    tenantId: config.tenantId,
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    fromEmail: config.fromEmail,
    fromName: config.fromName,
  };
}

export async function upsertSmtpConfig(tenantId: string, input: SmtpConfigInput) {
  const existing = await prisma.smtpConfig.findUnique({ where: { tenantId } });
  const updateData: Record<string, unknown> = {
    host: input.host,
    port: input.port,
    secure: input.secure,
    user: input.user,
    fromEmail: input.fromEmail,
    fromName: input.fromName ?? null,
  };
  const password = typeof input.password === "string" ? input.password.trim() : "";
  if (password.length > 0) {
    updateData.passwordEncrypted = input.password;
  } else if (existing) {
    updateData.passwordEncrypted = existing.passwordEncrypted;
  }
  if (!existing && !password) {
    throw new Error("Password is required when creating SMTP config");
  }
  return prisma.smtpConfig.upsert({
    where: { tenantId },
    create: {
      tenantId,
      host: input.host,
      port: input.port,
      secure: input.secure,
      user: input.user,
      passwordEncrypted: password || (existing?.passwordEncrypted ?? ""),
      fromEmail: input.fromEmail,
      fromName: input.fromName ?? null,
    },
    update: updateData as Parameters<typeof prisma.smtpConfig.update>[0]["data"],
  });
}

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  recordId?: string | null;
  userId?: string | null;
}

export async function sendEmail(tenantId: string, input: SendEmailInput): Promise<{ id: string; status: string }> {
  const config = await prisma.smtpConfig.findUnique({
    where: { tenantId },
  });
  if (!config || !config.passwordEncrypted) {
    throw new Error("SMTP not configured for this tenant");
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.passwordEncrypted,
    },
  });

  const mailOptions = {
    from: config.fromName ? `"${config.fromName}" <${config.fromEmail}>` : config.fromEmail,
    to: input.to,
    subject: input.subject,
    text: input.body,
    html: input.body.replace(/\n/g, "<br>"),
  };

  let status = "sent";
  let sentAt: Date | null = new Date();

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    await prisma.emailLog.create({
      data: {
        tenantId,
        recordId: input.recordId ?? null,
        to: input.to,
        subject: input.subject,
        body: input.body,
        status: "failed",
        sentAt: null,
      },
    });
    throw new Error(err instanceof Error ? err.message : "Email send failed");
  }

  const log = await prisma.emailLog.create({
    data: {
      tenantId,
      recordId: input.recordId ?? null,
      to: input.to,
      subject: input.subject,
      body: input.body,
      status,
      sentAt,
    },
  });

  if (input.recordId) {
    logActivity({
      tenantId,
      recordId: input.recordId,
      userId: input.userId ?? null,
      eventType: "email_sent",
      metadata: { emailLogId: log.id, to: input.to, subject: input.subject },
    }).catch(() => {});
  }

  return { id: log.id, status };
}

export async function listEmailLogs(tenantId: string, recordId?: string | null) {
  const where: { tenantId: string; recordId?: string | null } = { tenantId };
  if (recordId) where.recordId = recordId;
  return prisma.emailLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
