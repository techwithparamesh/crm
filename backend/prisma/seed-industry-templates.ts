/**
 * Seed industry CRM templates into the CrmTemplate table.
 * Inserts templates if they do not already exist (by name); optionally updates existing.
 *
 * Usage:
 *   npm run db:seed:industry  (add script to package.json)
 *   npx tsx prisma/seed-industry-templates.ts
 *
 * Or call from another seed:
 *   import { seedIndustryTemplates } from "./seed-industry-templates.js";
 *   await seedIndustryTemplates(prisma);
 */

import { PrismaClient } from "@prisma/client";
import { INDUSTRY_TEMPLATES } from "../src/modules/crm-templates/industry-templates.js";

export async function seedIndustryTemplates(prisma: PrismaClient, options?: { upsert?: boolean }) {
  const upsert = options?.upsert ?? true;

  for (const t of INDUSTRY_TEMPLATES) {
    const existing = await prisma.crmTemplate.findFirst({ where: { name: t.name } });
    const data = {
      name: t.name,
      category: t.category,
      description: t.description,
      icon: t.icon,
      templateJSON: JSON.stringify(t.json),
    };

    if (!existing) {
      await prisma.crmTemplate.create({ data });
      console.log("Created template:", t.name, `(${t.category})`);
    } else if (upsert) {
      await prisma.crmTemplate.update({ where: { id: existing.id }, data });
      console.log("Updated template:", t.name);
    }
  }

  console.log(`Industry templates seed done. ${INDUSTRY_TEMPLATES.length} templates processed.`);
}

async function main() {
  const prisma = new PrismaClient();
  await seedIndustryTemplates(prisma);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
