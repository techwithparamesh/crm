import path from "path";
import fs from "fs";
import { prisma } from "../../prisma/client.js";
import { mergeWhere } from "../../utils/tenantScopedRepository.js";
import { uploadToS3, deleteFromS3, isS3Configured } from "./s3.js";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const UPLOAD_URL_PREFIX = process.env.UPLOAD_URL_PREFIX ?? "/uploads";

function ensureLocalDir(tenantId: string, recordId: string): string {
  const dir = path.join(UPLOAD_DIR, tenantId, recordId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Save file: to S3 if configured, else to local disk. Returns URL for DB.
 */
export async function saveFile(
  tenantId: string,
  recordId: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string | undefined,
  uploadedBy: string | null
) {
  let fileUrl: string;
  if (isS3Configured()) {
    const url = await uploadToS3(tenantId, recordId, fileName, buffer, mimeType);
    if (!url) throw new Error("S3 upload failed (check S3 config)");
    fileUrl = url;
  } else {
    const dir = ensureLocalDir(tenantId, recordId);
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const uniqueName = `${Date.now()}-${safeName}`;
    const filePath = path.join(dir, uniqueName);
    fs.writeFileSync(filePath, buffer);
    fileUrl = `${UPLOAD_URL_PREFIX}/${tenantId}/${recordId}/${uniqueName}`;
  }

  const file = await prisma.file.create({
    data: {
      tenantId,
      recordId,
      fileName,
      fileUrl,
      uploadedBy: uploadedBy ?? undefined,
    },
  });
  return file;
}

export async function listByRecord(tenantId: string, recordId: string) {
  return prisma.file.findMany({
    where: mergeWhere(tenantId, { recordId }),
    orderBy: { createdAt: "desc" },
    include: { uploader: { select: { id: true, name: true, email: true } } },
  });
}

export async function deleteFile(tenantId: string, fileId: string): Promise<void> {
  const file = await prisma.file.findFirst({
    where: mergeWhere(tenantId, { id: fileId }),
  });
  if (!file) throw new Error("File not found");
  if (file.fileUrl.startsWith("http")) {
    await deleteFromS3(file.fileUrl).catch(() => {});
  } else {
    const localPath = path.join(UPLOAD_DIR, file.tenantId, file.recordId, path.basename(file.fileUrl));
    if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
  }
  await prisma.file.deleteMany({
    where: { id: fileId, tenantId },
  });
}
