/**
 * Sync CRM templates from code (TEMPLATES) to the database.
 * Run this after adding new templates to example-templates.ts so they appear on the Templates page.
 * Usage: npm run db:seed:templates  or  npx tsx prisma/seed-templates.ts
 */
import { PrismaClient } from "@prisma/client";
import { TEMPLATES } from "../src/modules/crm-templates/example-templates.js";

const prisma = new PrismaClient();

async function main() {
  for (const t of TEMPLATES) {
    const existing = await prisma.crmTemplate.findFirst({ where: { name: t.name } });
    const data = {
      name: t.name,
      category: t.category ?? null,
      description: t.description,
      icon: t.icon,
      templateJSON: JSON.stringify(t.json),
    };
    if (!existing) {
      await prisma.crmTemplate.create({ data });
      console.log("Created template:", t.name);
    } else {
      await prisma.crmTemplate.update({ where: { id: existing.id }, data });
      console.log("Updated template:", t.name);
    }
  }

  // Remove duplicate/legacy loan templates so only one "Loan CRM" shows
  const removed = await prisma.crmTemplate.deleteMany({
    where: {
      name: { in: ["Loan CRM (Classic)", "Loan CRM (Leads + Applicants)"] },
    },
  });
  if (removed.count > 0) {
    console.log("Removed duplicate template(s):", removed.count);
  }

  console.log("Templates sync done.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
