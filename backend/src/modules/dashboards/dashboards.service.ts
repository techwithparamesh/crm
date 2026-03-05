import { prisma } from "../../prisma/client.js";
import type { CreateDashboardInput, CreateWidgetInput, UpdateWidgetInput } from "./dashboards.validation.js";

export async function createDashboard(tenantId: string, input: CreateDashboardInput) {
  return prisma.dashboard.create({
    data: { tenantId, name: input.name },
  });
}

export async function listDashboards(tenantId: string) {
  return prisma.dashboard.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { widgets: true } } },
  });
}

export async function getDashboardById(tenantId: string, id: string) {
  const d = await prisma.dashboard.findFirst({
    where: { id, tenantId },
    include: { widgets: { orderBy: { orderIndex: "asc" } } },
  });
  if (!d) throw new Error("Dashboard not found");
  return d;
}

export async function createWidget(tenantId: string, input: CreateWidgetInput) {
  const dashboard = await prisma.dashboard.findFirst({
    where: { id: input.dashboardId, tenantId },
  });
  if (!dashboard) throw new Error("Dashboard not found");
  return prisma.widget.create({
    data: {
      dashboardId: input.dashboardId,
      widgetType: input.widgetType,
      configJSON: input.configJSON ?? null,
      orderIndex: input.orderIndex ?? 0,
    },
  });
}

export async function updateWidget(tenantId: string, widgetId: string, input: UpdateWidgetInput) {
  const w = await prisma.widget.findFirst({
    where: { id: widgetId },
    include: { dashboard: true },
  });
  if (!w || w.dashboard.tenantId !== tenantId) throw new Error("Widget not found");
  return prisma.widget.update({
    where: { id: widgetId },
    data: input,
  });
}

export async function deleteWidget(tenantId: string, widgetId: string) {
  const w = await prisma.widget.findFirst({
    where: { id: widgetId },
    include: { dashboard: true },
  });
  if (!w || w.dashboard.tenantId !== tenantId) throw new Error("Widget not found");
  return prisma.widget.delete({ where: { id: widgetId } });
}
