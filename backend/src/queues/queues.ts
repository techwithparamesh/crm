/**
 * BullMQ queue definitions. Queues are only created when REDIS_URL is set.
 * Uses connection options parsed from REDIS_URL so BullMQ uses its own Redis client.
 */

import { Queue } from "bullmq";

const REDIS_URL = process.env.REDIS_URL;

function getBullMQConnection(): { host: string; port: number; username?: string; password?: string } | undefined {
  if (!REDIS_URL?.trim()) return undefined;
  try {
    const u = new URL(REDIS_URL);
    return {
      host: u.hostname,
      port: parseInt(u.port || "6379", 10),
      ...(u.username && { username: u.username }),
      ...(u.password && { password: u.password }),
    };
  } catch {
    return undefined;
  }
}

const connectionOptions = getBullMQConnection();
const connection = connectionOptions ? { connection: connectionOptions } : undefined;

const defaultJobOptions = {
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 500 },
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 1000 },
};

export const csvImportQueue =
  connection &&
  new Queue<{
    jobId: string;
    tenantId: string;
    moduleId: string;
    mapping: Record<string, string>;
    rows: Record<string, string>[];
    createdBy: string | null;
  }>("csv-import", {
    ...connection,
    defaultJobOptions,
  });

export const webhookDispatchQueue =
  connection &&
  new Queue<{
    tenantId: string;
    eventType: string;
    payload: Record<string, unknown>;
  }>("webhook-dispatch", {
    ...connection,
    defaultJobOptions: { ...defaultJobOptions, attempts: 4 },
  });

export const automationRunQueue =
  connection &&
  new Queue<{
    tenantId: string;
    moduleId?: string;
    recordId?: string;
    userId?: string;
    triggerType: string;
    payload?: Record<string, unknown>;
    recordValues?: Record<string, unknown>;
  }>("automation-run", {
    ...connection,
    defaultJobOptions,
  });

export const emailSendQueue =
  connection &&
  new Queue<{
    tenantId: string;
    to: string;
    subject: string;
    body: string;
    recordId?: string | null;
    userId?: string | null;
  }>("email-send", {
    ...connection,
    defaultJobOptions,
  });

export const whatsappSendQueue =
  connection &&
  new Queue<{
    tenantId: string;
    phoneNumber: string;
    type: "text" | "template";
    body?: string;
    templateId?: string;
    templateVariables?: Record<string, string>;
    recordId?: string | null;
    conversationId?: string | null;
  }>("whatsapp_send", {
    ...connection,
    defaultJobOptions: { ...defaultJobOptions, attempts: 4 },
  });

export function areQueuesAvailable(): boolean {
  return !!connectionOptions && !!csvImportQueue;
}
