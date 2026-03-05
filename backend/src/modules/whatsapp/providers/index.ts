import type { IWhatsAppProvider, WhatsAppProviderName } from "./types.js";
import { MetaWhatsAppProvider } from "./meta.provider.js";
import { TwilioWhatsAppProvider } from "./twilio.provider.js";
import { Dialog360WhatsAppProvider } from "./dialog.provider.js";

export type { IWhatsAppProvider, WhatsAppProviderName, SendMessageResult, SendTemplateResult, MessageStatusResult } from "./types.js";

const PROVIDER = (process.env.WHATSAPP_PROVIDER ?? "meta").toLowerCase() as WhatsAppProviderName;

export function getWhatsAppProvider(): IWhatsAppProvider | null {
  switch (PROVIDER) {
    case "meta": {
      const phoneId = process.env.WHATSAPP_META_PHONE_ID;
      const token = process.env.WHATSAPP_META_ACCESS_TOKEN;
      if (!phoneId || !token) return null;
      return new MetaWhatsAppProvider({ phoneId, accessToken: token });
    }
    case "twilio": {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const auth = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_WHATSAPP_FROM;
      if (!sid || !auth || !from) return null;
      return new TwilioWhatsAppProvider({ accountSid: sid, authToken: auth, from });
    }
    case "dialog": {
      const apiKey = process.env.DIALOG_API_KEY;
      if (!apiKey) return null;
      return new Dialog360WhatsAppProvider({ apiKey, channelId: process.env.DIALOG_CHANNEL_ID });
    }
    default:
      return null;
  }
}
