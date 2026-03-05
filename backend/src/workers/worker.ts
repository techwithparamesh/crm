/**
 * Background job worker (run separately: npx tsx src/workers/worker.ts).
 * Processes csv-import, webhook-dispatch, automation-run, email-send queues.
 */

import { Worker } from "bullmq";
import { runImportJobFromQueue } from "../modules/import-export/importExport.service.js";
import { dispatchWebhooks } from "../modules/webhooks/webhook-dispatcher.js";
import { fireAutomations } from "../modules/automations/automation-engine.js";
import { sendEmail } from "../modules/email/email.service.js";
import * as whatsappService from "../modules/whatsapp/whatsapp.service.js";

const REDIS_URL = process.env.REDIS_URL;

function getConnection() {
  if (!REDIS_URL?.trim()) return null;
  try {
    const u = new URL(REDIS_URL);
    return {
      host: u.hostname,
      port: parseInt(u.port || "6379", 10),
      ...(u.username && { username: u.username }),
      ...(u.password && { password: u.password }),
    };
  } catch {
    return null;
  }
}

const connection = getConnection();
if (!connection) {
  console.error("REDIS_URL not set. Worker requires Redis.");
  process.exit(1);
}

async function runCsvImportJob(payload: {
  jobId: string;
  tenantId: string;
  moduleId: string;
  mapping: Record<string, string>;
  rows: Record<string, string>[];
  createdBy: string | null;
}) {
  await runImportJobFromQueue(
    payload.jobId,
    payload.tenantId,
    payload.moduleId,
    payload.mapping,
    payload.rows,
    payload.createdBy
  );
}

async function runWebhookDispatch(data: {
  tenantId: string;
  eventType: string;
  payload: Record<string, unknown>;
}) {
  await dispatchWebhooks(data.tenantId, data.eventType, data.payload as Parameters<typeof dispatchWebhooks>[2]);
}

async function runAutomation(payload: {
  tenantId: string;
  moduleId?: string;
  recordId?: string;
  userId?: string;
  triggerType: string;
  payload?: Record<string, unknown>;
  recordValues?: Record<string, unknown>;
}) {
  await fireAutomations(payload.triggerType, {
    tenantId: payload.tenantId,
    moduleId: payload.moduleId,
    recordId: payload.recordId,
    userId: payload.userId,
    payload: payload.payload,
  }, payload.recordValues);
}

async function runEmailSend(payload: {
  tenantId: string;
  to: string;
  subject: string;
  body: string;
  recordId?: string | null;
  userId?: string | null;
}) {
  await sendEmail(payload.tenantId, {
    to: payload.to,
    subject: payload.subject,
    body: payload.body,
    recordId: payload.recordId ?? null,
    userId: payload.userId ?? null,
  });
}

async function runWhatsAppSend(payload: {
  tenantId: string;
  phoneNumber: string;
  type: "text" | "template";
  body?: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
  recordId?: string | null;
  conversationId?: string | null;
}) {
  if (payload.type === "template" && payload.templateId) {
    await whatsappService.sendTemplate(
      payload.tenantId,
      payload.phoneNumber,
      payload.templateId,
      payload.templateVariables ?? {},
      { recordId: payload.recordId, conversationId: payload.conversationId }
    );
  } else {
    await whatsappService.sendMessage(
      payload.tenantId,
      payload.phoneNumber,
      payload.body ?? "",
      { recordId: payload.recordId, conversationId: payload.conversationId }
    );
  }
}

const workerConnection = { connection };

const csvImportWorker =
  new Worker(
    "csv-import",
    async (job) => {
      await runCsvImportJob(job.data);
    },
    workerConnection
  );

const webhookWorker =
  new Worker(
    "webhook-dispatch",
    async (job) => {
      await runWebhookDispatch(job.data);
    },
    workerConnection
  );

const automationWorker =
  new Worker(
    "automation-run",
    async (job) => {
      await runAutomation(job.data);
    },
    workerConnection
  );

const emailWorker =
  new Worker(
    "email-send",
    async (job) => {
      await runEmailSend(job.data);
    },
    workerConnection
  );

const whatsappSendWorker =
  new Worker(
    "whatsapp_send",
    async (job) => {
      await runWhatsAppSend(job.data);
    },
    workerConnection
  );

[csvImportWorker, webhookWorker, automationWorker, emailWorker, whatsappSendWorker].forEach((w) => {
  w.on("completed", (job) => console.log(`[worker] ${w.name} job ${job.id} completed`));
  w.on("failed", (job, err) => console.error(`[worker] ${w.name} job ${job?.id} failed:`, err));
});

console.log("Background worker started. Waiting for jobs...");

process.on("SIGTERM", async () => {
  await Promise.all([
    csvImportWorker.close(),
    webhookWorker.close(),
    automationWorker.close(),
    emailWorker.close(),
    whatsappSendWorker.close(),
  ]);
  process.exit(0);
});
