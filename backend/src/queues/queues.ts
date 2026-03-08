/**
 * BullMQ queue definitions. Queues are only created when REDIS_URL is set and Redis >= 5.
 * If Redis is missing or version < 5, queues stay null and the server runs without background jobs.
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

type CsvImportJob = {
  jobId: string;
  tenantId: string;
  moduleId: string;
  mapping: Record<string, string>;
  rows: Record<string, string>[];
  createdBy: string | null;
};
type WebhookJob = { tenantId: string; eventType: string; payload: Record<string, unknown> };
type AutomationJob = {
  tenantId: string;
  moduleId?: string;
  recordId?: string;
  userId?: string;
  triggerType: string;
  payload?: Record<string, unknown>;
  recordValues?: Record<string, unknown>;
};
type EmailJob = {
  tenantId: string;
  to: string;
  subject: string;
  body: string;
  recordId?: string | null;
  userId?: string | null;
};
type WhatsappJob = {
  tenantId: string;
  phoneNumber: string;
  type: "text" | "template";
  body?: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
  recordId?: string | null;
  conversationId?: string | null;
};

export let csvImportQueue: Queue<CsvImportJob> | null = null;
export let webhookDispatchQueue: Queue<WebhookJob> | null = null;
export let automationRunQueue: Queue<AutomationJob> | null = null;
export let emailSendQueue: Queue<EmailJob> | null = null;
export let whatsappSendQueue: Queue<WhatsappJob> | null = null;

/** Check Redis version via INFO server; BullMQ requires Redis >= 5. */
async function isRedisVersionSupported(): Promise<boolean> {
  if (!REDIS_URL?.trim()) return false;
  try {
    const Redis = (await import("ioredis")).default;
    const r = new Redis(REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 3000 });
    const info = await r.info("server");
    await r.quit();
    const m = info.match(/redis_version:(\d+\.\d+\.\d+)/);
    const version = m ? m[1] : "0.0.0";
    const major = parseInt(version.split(".")[0] || "0", 10);
    if (major < 5) {
      console.warn(`Redis version must be >= 5.0 for BullMQ (current: ${version}). Background job queues disabled.`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("Redis unavailable or version check failed. Background job queues disabled.", (e as Error).message);
    return false;
  }
}

/** Initialize BullMQ queues if REDIS_URL is set and Redis version >= 5. Call once at startup. */
export async function initQueues(): Promise<void> {
  if (!connection) return;
  const ok = await isRedisVersionSupported();
  if (!ok) return;
  try {
    csvImportQueue = new Queue<CsvImportJob>("csv-import", { ...connection, defaultJobOptions });
    webhookDispatchQueue = new Queue<WebhookJob>("webhook-dispatch", {
      ...connection,
      defaultJobOptions: { ...defaultJobOptions, attempts: 4 },
    });
    automationRunQueue = new Queue<AutomationJob>("automation-run", { ...connection, defaultJobOptions });
    emailSendQueue = new Queue<EmailJob>("email-send", { ...connection, defaultJobOptions });
    whatsappSendQueue = new Queue<WhatsappJob>("whatsapp_send", {
      ...connection,
      defaultJobOptions: { ...defaultJobOptions, attempts: 4 },
    });
  } catch (e) {
    console.warn("Failed to create BullMQ queues:", (e as Error).message);
  }
}

export function areQueuesAvailable(): boolean {
  return !!csvImportQueue;
}
