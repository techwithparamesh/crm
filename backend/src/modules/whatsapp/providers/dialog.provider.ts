/**
 * 360Dialog WhatsApp Business API adapter.
 * Configure with DIALOG_API_KEY, DIALOG_CHANNEL_ID (optional).
 */

import type {
  IWhatsAppProvider,
  SendMessageResult,
  SendTemplateResult,
  MessageStatusResult,
} from "./types.js";

const DIALOG_BASE = "https://waba.360dialog.io/v1";

export class Dialog360WhatsAppProvider implements IWhatsAppProvider {
  readonly name = "dialog";
  private apiKey: string;
  private channelId?: string;

  constructor(config: { apiKey: string; channelId?: string }) {
    this.apiKey = config.apiKey;
    this.channelId = config.channelId;
  }

  private async request<T>(path: string, body: unknown, method = "POST"): Promise<T> {
    const url = `${DIALOG_BASE}${path}`;
    const res = await fetch(url, {
      method,
      headers: {
        "D360-API-KEY": this.apiKey,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
    if (!res.ok) throw new Error(data?.error?.message ?? `360Dialog API ${res.status}`);
    return data;
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) return digits;
    return digits.length <= 10 ? `91${digits}` : digits;
  }

  async sendMessage(phone: string, body: string): Promise<SendMessageResult> {
    const to = this.normalizePhone(phone);
    const result = await this.request<{ messages: Array<{ id: string }> }>("/messages", {
      recipient_type: "individual",
      to,
      type: "text",
      text: { body },
      ...(this.channelId && { channel_id: this.channelId }),
    });
    const id = (result as { messages?: Array<{ id: string }> }).messages?.[0]?.id;
    if (!id) throw new Error("360Dialog did not return message id");
    return { providerMessageId: id, status: "sent" };
  }

  async sendTemplate(
    phone: string,
    templateNameOrId: string,
    variables: Record<string, string>,
    _context?: Record<string, string>
  ): Promise<SendTemplateResult> {
    const to = this.normalizePhone(phone);
    const template: Record<string, unknown> = {
      name: templateNameOrId,
      language: { code: "en" },
    };
    const keys = Object.keys(variables).sort();
    if (keys.length > 0) {
      (template as Record<string, unknown>).components = [
        {
          type: "body",
          parameters: keys.map((k) => ({ type: "text", text: variables[k] })),
        },
      ];
    }
    const result = await this.request<{ messages: Array<{ id: string }> }>("/messages", {
      recipient_type: "individual",
      to,
      type: "template",
      template,
      ...(this.channelId && { channel_id: this.channelId }),
    });
    const id = (result as { messages?: Array<{ id: string }> }).messages?.[0]?.id;
    if (!id) throw new Error("360Dialog did not return message id");
    return { providerMessageId: id, status: "sent" };
  }

  async fetchMessageStatus(providerMessageId: string): Promise<MessageStatusResult> {
    const result = await this.request<{ status?: string }>(
      `/messages/${providerMessageId}`,
      undefined,
      "GET"
    );
    const status = ((result as { status?: string }).status ?? "sent") as MessageStatusResult["status"];
    return { providerMessageId, status };
  }
}
