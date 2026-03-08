/**
 * Role–dashboard mapping: assign dashboards to roles for role-based home dashboards.
 */

import { prisma } from "../../prisma/client.js";

export async function getDashboardIdForRole(tenantId: string, roleId: string | null): Promise<string | null> {
  if (!roleId) return null;
  const rd = await prisma.roleDashboard.findFirst({
    where: { tenantId, roleId },
    orderBy: { orderIndex: "asc" },
    include: { dashboard: { select: { id: true, name: true } } },
  });
  return rd?.dashboard?.id ?? null;
}

export async function getDashboardForCurrentUser(tenantId: string, roleId: string | null): Promise<{ id: string; name: string } | null> {
  if (!roleId) return null;
  const rd = await prisma.roleDashboard.findFirst({
    where: { tenantId, roleId },
    orderBy: { orderIndex: "asc" },
    include: { dashboard: { select: { id: true, name: true } } },
  });
  return rd?.dashboard ?? null;
}

export async function listRoleDashboards(tenantId: string) {
  return prisma.roleDashboard.findMany({
    where: { tenantId },
    orderBy: [{ roleId: "asc" }, { orderIndex: "asc" }],
    include: {
      role: { select: { id: true, name: true } },
      dashboard: { select: { id: true, name: true } },
    },
  });
}

export async function createRoleDashboard(
  tenantId: string,
  data: { roleId: string; dashboardId: string; orderIndex?: number }
) {
  const role = await prisma.role.findFirst({ where: { id: data.roleId, tenantId } });
  const dashboard = await prisma.dashboard.findFirst({ where: { id: data.dashboardId, tenantId } });
  if (!role || !dashboard) throw new Error("Role or dashboard not found");
  return prisma.roleDashboard.create({
    data: {
      tenantId,
      roleId: data.roleId,
      dashboardId: data.dashboardId,
      orderIndex: data.orderIndex ?? 0,
    },
    include: {
      role: { select: { id: true, name: true } },
      dashboard: { select: { id: true, name: true } },
    },
  });
}

export async function deleteRoleDashboard(tenantId: string, id: string) {
  await prisma.roleDashboard.findFirstOrThrow({ where: { id, tenantId } });
  await prisma.roleDashboard.delete({ where: { id } });
}
