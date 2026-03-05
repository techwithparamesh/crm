import { prisma } from "../../prisma/client.js";
import { generateApiToken, hashApiToken } from "../../utils/hashToken.js";
import type { CreateApiTokenInput } from "./api-tokens.validation.js";

export async function createApiToken(tenantId: string, createdBy: string | null, input: CreateApiTokenInput) {
  const plainToken = generateApiToken();
  const tokenHash = hashApiToken(plainToken);
  const created = await prisma.apiToken.create({
    data: {
      tenantId,
      name: input.name,
      tokenHash,
      permissionsJSON: input.permissionsJSON ?? null,
      createdBy: createdBy ?? null,
    },
  });
  return {
    id: created.id,
    name: created.name,
    token: plainToken,
    createdAt: created.createdAt,
    lastUsedAt: created.lastUsedAt,
  };
}

export async function listApiTokens(tenantId: string) {
  return prisma.apiToken.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      lastUsedAt: true,
      createdBy: true,
    },
  });
}

export async function deleteApiToken(tenantId: string, id: string) {
  await prisma.apiToken.deleteMany({
    where: { id, tenantId },
  });
}
