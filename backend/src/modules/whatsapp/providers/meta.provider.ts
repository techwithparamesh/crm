/**
 * Meta Cloud API (WhatsApp Business) adapter.
 * Configure with WHATSAPP_META_PHONE_ID, WHATSAPP_META_ACCESS_TOKEN.
 */

import type {
  IWhatsAppProvider,
  SendMessageResult,
  SendTemplateResult,
  MessageStatusResult,
} from "./types.js";

export class MetaWhatsAppProvider implements IWhatsAppProvider {
  readonly name = "meta";
  private phoneId: string;
  private accessToken: string;
  private baseUrl = "https://graph.facebook.com/v18.0";

  constructor(config: { phoneId: string; accessToken: string }) {
    this.phoneId = config.phoneId;
    this.accessToken = config.accessToken;
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}/${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken}`,
      },
      body: JSON.stringify(body),
    });
    const data = (await res.json()) as { error?: { message: string }; messages?: Array<{ id: string }> };
    if (!res.ok) throw new Error(data?.error?.message ?? `Meta API ${res.status}`);
    return data as T;
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, "");
    return digits.startsWith("0") ? digits : digits.length <= 10 ? `91${digits}` : digits;
  }

  async sendMessage(phone: string, body: string): Promise<SendMessageResult> {
    const to = this.normalizePhone(phone);
    const result = await this.request<{ messages: Array<{ id: string }> }>(
      `${this.phoneId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.replace(/^\+/, ""),
        type: "text",
        text: { body },
      }
    );
    const id = result.messages?.[0]?.id;
    if (!id) throw new Error("Meta API did not return message id");
    return { providerMessageId: id, status: "sent" };
  }

  async sendTemplate(
    phone: string,
    templateNameOrId: string,
    variables: Record<string, string>,
    _context?: Record<string, string>
  ): Promise<SendTemplateResult> {
    const to = this.normalizePhone(phone);
    const components: Array<{ type: string; sub_type?: string; parameters: Array<{ type: string; text: string }> }> = [];
    const keys = Object.keys(variables).sort();
    if (keys.length > 0) {
      components.push({
        type: "body",
        parameters: keys.map((k) => ({ type: "text", text: variables[k] })),
      });
    }
    const body: Record<string, unknown> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to.replace(/^\+/, ""),
      type: "template",
      template: {
        name: templateNameOrId.replace(/\s+/g, "_").toLowerCase(),
        language: { code: "en" },
      },
    };
    if (components.length > 0) (body.template as Record<string, unknown>).components = components;
    const result = await this.request<{ messages: Array<{ id: string }> }>(
      `${this.phoneId}/messages`,
      body
    );
    const id = result.messages?.[0]?.id;
    if (!id) throw new Error("Meta API did not return message id");
    return { providerMessageId: id, status: "sent" };
  }

  async fetchMessageStatus(providerMessageId: string): Promise<MessageStatusResult> {
    const res = await fetch(
      `${this.baseUrl}/${providerMessageId}?fields=status`,
      { headers: { Authorization: `Bearer ${this.accessToken}` } }
    );
    const data = (await res.json()) as { status?: string };
    const status = (data?.status ?? "sent") as MessageStatusResult["status"];
    return { providerMessageId, status };
  }
}
