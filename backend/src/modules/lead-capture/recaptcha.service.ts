/**
 * Google reCAPTCHA v2/v3 verification for form submissions.
 */

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export async function verifyRecaptcha(token: string, expectedAction?: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;

  try {
    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as {
      success?: boolean;
      action?: string;
      score?: number;
      "error-codes"?: string[];
    };
    if (!data.success) return false;
    if (expectedAction && data.action && data.action !== expectedAction) return false;
    if (typeof data.score === "number" && data.score < 0.5) return false;
    return true;
  } catch {
    return false;
  }
}
