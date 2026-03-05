import crypto from "crypto";

const PROVIDER = (process.env.WHATSAPP_PROVIDER ?? "meta").toLowerCase();

/**
 * Verify webhook signature from provider. Returns true if valid or if no secret configured.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string | undefined,
  secret: string | undefined
): boolean {
  if (!secret) return true;
  if (!signature) return false;

  const body = typeof rawBody === "string" ? Buffer.from(rawBody, "utf8") : rawBody;

  if (PROVIDER === "meta") {
    const expected = "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"));
  }

  if (PROVIDER === "twilio") {
    const url = process.env.TWILIO_WEBHOOK_URL ?? "https://example.com/whatsapp/webhook";
    const payload = url + body.toString();
    const expected = crypto.createHmac("sha1", secret).update(payload).digest("base64");
    return crypto.timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"));
  }

  if (PROVIDER === "dialog") {
    const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"));
  }

  return true;
}

export function getWebhookSecret(): string | undefined {
  if (PROVIDER === "meta") return process.env.WHATSAPP_META_APP_SECRET;
  if (PROVIDER === "twilio") return process.env.TWILIO_AUTH_TOKEN;
  if (PROVIDER === "dialog") return process.env.DIALOG_WEBHOOK_SECRET;
  return undefined;
}
