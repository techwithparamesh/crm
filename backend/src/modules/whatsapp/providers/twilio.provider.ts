/**
 * Twilio WhatsApp adapter.
 * Configure with TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM (e.g. whatsapp:+14155238886).
 */

import type {
  IWhatsAppProvider,
  SendMessageResult,
  SendTemplateResult,
  MessageStatusResult,
} from "./types.js";

export class TwilioWhatsAppProvider implements IWhatsAppProvider {
  readonly name = "twilio";
  private accountSid: string;
  private authToken: string;
  private from: string;
  private baseUrl: string;

  constructor(config: { accountSid: string; authToken: string; from: string }) {
    this.accountSid = config.accountSid;
    this.authToken = config.authToken;
    this.from = config.from.startsWith("whatsapp:") ? config.from : `whatsapp:${config.from}`;
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}`;
  }

  private async request<T>(path: string, opts: { method?: string; body?: URLSearchParams } = {}): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: opts.method ?? "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: opts.body?.toString(),
    });
    const text = await res.text();
    const data = text ? (JSON.parse(text) as T) : ({} as T);
    if (!res.ok) throw new Error((data as { message?: string })?.message ?? `Twilio ${res.status}`);
    return data;
  }

  private toWhatsAppNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    const normalized = digits.startsWith("0") ? digits.slice(1) : digits.length <= 10 ? `91${digits}` : digits;
    return `whatsapp:+${normalized}`;
  }

  async sendMessage(phone: string, body: string): Promise<SendMessageResult> {
    const params = new URLSearchParams({
      To: this.toWhatsAppNumber(phone),
      From: this.from,
      Body: body,
    });
    const result = await this.request<{ sid: string; status: string }>("/Messages.json", {
      method: "POST",
      body: params,
    });
    return { providerMessageId: result.sid, status: result.status ?? "sent" };
  }

  async sendTemplate(
    phone: string,
    _templateNameOrId: string,
    variables: Record<string, string>,
    _context?: Record<string, string>
  ): Promise<SendTemplateResult> {
    const body =
      Object.keys(variables).length > 0
        ? Object.entries(variables)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n")
        : "Message";
    return this.sendMessage(phone, body);
  }

  async fetchMessageStatus(providerMessageId: string): Promise<MessageStatusResult> {
    const result = await this.request<{ status: string }>(`/Messages/${providerMessageId}.json`);
    const status = (result.status === "delivered" || result.status === "read"
      ? result.status
      : result.status === "failed"
        ? "failed"
        : "sent") as MessageStatusResult["status"];
    return { providerMessageId, status };
  }
}
