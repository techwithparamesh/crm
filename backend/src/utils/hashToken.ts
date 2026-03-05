import crypto from "crypto";

const HASH_ALG = "sha256";

export function hashApiToken(token: string): string {
  return crypto.createHash(HASH_ALG).update(token, "utf8").digest("hex");
}

export function generateApiToken(): string {
  return `crm_${crypto.randomBytes(32).toString("hex")}`;
}
