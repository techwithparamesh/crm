/**
 * WhatsApp provider abstraction. All adapters implement this interface.
 */

export interface SendMessageResult {
  providerMessageId: string;
  status: string;
}

export interface SendTemplateResult {
  providerMessageId: string;
  status: string;
}

export interface MessageStatusResult {
  providerMessageId: string;
  status: "sent" | "delivered" | "read" | "failed";
}

export interface IWhatsAppProvider {
  readonly name: string;
  sendMessage(phone: string, body: string, context?: Record<string, string>): Promise<SendMessageResult>;
  sendTemplate(
    phone: string,
    templateNameOrId: string,
    variables: Record<string, string>,
    context?: Record<string, string>
  ): Promise<SendTemplateResult>;
  fetchMessageStatus(providerMessageId: string): Promise<MessageStatusResult>;
}

export type WhatsAppProviderName = "meta" | "twilio" | "dialog";
