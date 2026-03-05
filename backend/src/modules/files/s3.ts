/**
 * S3-compatible storage (AWS S3, MinIO, DigitalOcean Spaces, etc.).
 * Set S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY. Optional: S3_ENDPOINT, S3_REGION, S3_PUBLIC_URL.
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const bucket = process.env.S3_BUCKET ?? "";
const region = process.env.S3_REGION ?? "us-east-1";
const endpoint = process.env.S3_ENDPOINT || undefined;
const publicUrlBase = process.env.S3_PUBLIC_URL || undefined; // e.g. https://bucket.s3.region.amazonaws.com

let client: S3Client | null = null;

function getClient(): S3Client | null {
  if (!bucket || !process.env.S3_ACCESS_KEY || !process.env.S3_SECRET_KEY) return null;
  if (!client) {
    client = new S3Client({
      region,
      ...(endpoint && { endpoint, forcePathStyle: endpoint.includes("localhost") || endpoint.includes("minio") }),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
      },
    });
  }
  return client;
}

export function isS3Configured(): boolean {
  return !!(bucket && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY);
}

/**
 * Upload buffer to S3. Key = tenantId/recordId/uniqueId-fileName.
 * Returns public URL (S3_PUBLIC_URL + key) or null if S3 not configured.
 */
export async function uploadToS3(
  tenantId: string,
  recordId: string,
  fileName: string,
  buffer: Buffer,
  mimeType?: string
): Promise<string | null> {
  const c = getClient();
  if (!c) return null;
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `${tenantId}/${recordId}/${Date.now()}-${safeName}`;
  await c.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType ?? "application/octet-stream",
    })
  );
  if (publicUrlBase) {
    const base = publicUrlBase.replace(/\/$/, "");
    return `${base}/${key}`;
  }
  return key;
}

/**
 * Delete object from S3 by key or by URL (extract key from URL if it contains bucket/path).
 */
export async function deleteFromS3(fileUrl: string): Promise<void> {
  const c = getClient();
  if (!c) return;
  let key = fileUrl;
  if (fileUrl.startsWith("http")) {
    try {
      const u = new URL(fileUrl);
      key = u.pathname.replace(/^\//, "");
    } catch {
      return;
    }
  }
  await c.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}
