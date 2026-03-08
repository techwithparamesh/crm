import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TEMPLATES } from "../src/modules/crm-templates/example-templates.js";

const prisma = new PrismaClient();

const PLANS = [
  { name: "Starter", description: "For small teams", pricePerUser: 399, maxUsers: 10, maxModules: 5, maxRecords: 1000, maxAutomations: 5 },
  { name: "Growth", description: "For growing businesses", pricePerUser: 699, maxUsers: 25, maxModules: 15, maxRecords: 10000, maxAutomations: 20 },
  { name: "Pro", description: "For large organizations", pricePerUser: 999, maxUsers: 100, maxModules: 50, maxRecords: 100000, maxAutomations: 100 },
];

async function main() {
  for (const p of PLANS) {
    const existing = await prisma.plan.findFirst({ where: { name: p.name } });
    if (!existing) {
      const plan = await prisma.plan.create({
        data: {
          name: p.name,
          description: p.description,
          pricePerUser: p.pricePerUser,
          billingCycle: "monthly",
          isActive: true,
        },
      });
      await prisma.planLimit.create({
        data: {
          planId: plan.id,
          maxUsers: p.maxUsers,
          maxModules: p.maxModules,
          maxRecords: p.maxRecords,
          maxAutomations: p.maxAutomations,
          maxApiCalls: null,
          maxStorageGB: null,
        },
      });
      console.log("Created plan:", plan.name);
    }
  }

  let tenant = await prisma.tenant.findFirst({ where: { name: "Acme Corp" } });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: { name: "Acme Corp", plan: "free" },
    });
    await prisma.tenantSettings.create({
      data: { tenantId: tenant.id },
    });
  } else {
    const existingSettings = await prisma.tenantSettings.findUnique({ where: { tenantId: tenant.id } });
    if (!existingSettings) {
      await prisma.tenantSettings.create({
        data: { tenantId: tenant.id },
      });
    }
  }

  let role = await prisma.role.findFirst({ where: { tenantId: tenant.id, name: "Admin" } });
  if (!role) {
    role = await prisma.role.create({
      data: {
        tenantId: tenant.id,
        name: "Admin",
        permissionsJSON: JSON.stringify({ modules: ["read", "write"], records: ["read", "write"], pipelines: ["read", "write"] }),
      },
    });
  }

  let user = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: "admin@acme.com" } });
  if (!user) {
    const hash = await bcrypt.hash("password123", 10);
    user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        roleId: role.id,
        name: "Admin User",
        email: "admin@acme.com",
        passwordHash: hash,
      },
    });
  }

  // No default modules created — tenants start with an empty Modules list.
  // Create modules via "+ New module" or install a template from Templates.

  for (const t of TEMPLATES) {
    const existing = await prisma.crmTemplate.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.crmTemplate.create({
        data: {
          name: t.name,
          category: t.category ?? null,
          description: t.description,
          icon: t.icon,
          templateJSON: JSON.stringify(t.json),
        },
      });
      console.log("Created template:", t.name);
    }
  }

  console.log("Seed done:", { tenant: tenant.name });
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
