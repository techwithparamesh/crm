/**
 * CRM template listing and installation.
 * installCRMTemplate delegates to template-installer.service (supports legacy + spec config).
 */

import { prisma } from "../../prisma/client.js";
import { installTemplateWithProgress } from "../../services/template-installer.service.js";

export async function listTemplates() {
  return prisma.crmTemplate.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      category: true,
      description: true,
      icon: true,
      createdAt: true,
    },
  });
}

export async function getTemplateById(id: string) {
  const t = await prisma.crmTemplate.findUnique({
    where: { id },
  });
  if (!t) throw new Error("Template not found");
  return t;
}

export async function installCRMTemplate(templateId: string, tenantId: string): Promise<{ installed: boolean }> {
  return installTemplateWithProgress(templateId, tenantId, () => {});
}
