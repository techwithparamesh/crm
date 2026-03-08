import path from "path";
import fs from "fs";
import { prisma } from "../../prisma/client.js";
import type { UpdateTenantSettingsInput } from "./tenant-settings.validation.js";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const UPLOAD_URL_PREFIX = process.env.UPLOAD_URL_PREFIX ?? "/uploads";

function ensureUploadDir(tenantId: string): string {
  const dir = path.join(UPLOAD_DIR, tenantId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function getSettings(tenantId: string) {
  let row = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  });
  if (!row) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error("Tenant not found");
    }
    row = await prisma.tenantSettings.create({
      data: { tenantId },
    });
  }
  return row;
}

export async function getSettingsByDomain(customDomain: string) {
  const row = await prisma.tenantSettings.findFirst({
    where: { customDomain: customDomain.toLowerCase().trim() },
    include: { tenant: true },
  });
  return row;
}

export async function updateSettings(tenantId: string, input: UpdateTenantSettingsInput) {
  const data: Record<string, unknown> = {};
  if (input.companyName !== undefined) data.companyName = input.companyName || null;
  if (input.logoUrl !== undefined) data.logoUrl = input.logoUrl || null;
  if (input.faviconUrl !== undefined) data.faviconUrl = input.faviconUrl || null;
  if (input.primaryColor !== undefined) data.primaryColor = input.primaryColor || null;
  if (input.secondaryColor !== undefined) data.secondaryColor = input.secondaryColor || null;
  if (input.customDomain !== undefined) data.customDomain = input.customDomain?.trim() || null;

  const existing = await prisma.tenantSettings.findUnique({ where: { tenantId } });
  if (!existing) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error("Tenant not found");
    }
    return prisma.tenantSettings.create({
      data: { tenantId, ...data },
    });
  }
  return prisma.tenantSettings.update({
    where: { tenantId },
    data: data as Parameters<typeof prisma.tenantSettings.update>[0]["data"],
  });
}

export async function saveUpload(tenantId: string, type: "logo" | "favicon", base64Data: string): Promise<string> {
  const dir = ensureUploadDir(tenantId);
  const ext = base64Data.startsWith("data:image/svg") ? "svg" : "png";
  const filename = type === "logo" ? `logo.${ext}` : `favicon.${ext}`;
  const filePath = path.join(dir, filename);
  const base64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
  const buf = Buffer.from(base64, "base64");
  fs.writeFileSync(filePath, buf);
  return `${UPLOAD_URL_PREFIX}/${tenantId}/${filename}`;
}
