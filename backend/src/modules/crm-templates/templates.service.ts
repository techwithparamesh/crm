/**
 * CRM template listing and installation. installCRMTemplate creates modules, fields, pipelines, dashboards, roles for a tenant.
 */

import { prisma } from "../../prisma/client.js";
import { createModule } from "../modules/modules.service.js";
import { createField } from "../fields/fields.service.js";
import { createPipeline } from "../pipelines/pipelines.service.js";
import { createStage } from "../pipelines/pipelines.service.js";
import { createDashboard, createWidget } from "../dashboards/dashboards.service.js";
import { createRole } from "../roles/roles.service.js";
import { cacheDel } from "../../utils/redis.js";
import { moduleMetadataKey } from "../../utils/cacheKeys.js";
import type { CrmTemplateJSON } from "./templates.types.js";

export async function listTemplates() {
  return prisma.crmTemplate.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
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
  const template = await getTemplateById(templateId);
  let json: CrmTemplateJSON;
  try {
    json = JSON.parse(template.templateJSON) as CrmTemplateJSON;
  } catch {
    throw new Error("Invalid template JSON");
  }

  if (!json.modules?.length) {
    throw new Error("Template has no modules");
  }

  const slugToModuleId = new Map<string, string>();

  for (const mod of json.modules) {
    const slug = mod.slug || mod.name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "");
    const created = await createModule(tenantId, {
      name: mod.name,
      slug,
      icon: mod.icon ?? "folder",
      description: mod.description ?? undefined,
    });
    slugToModuleId.set(mod.slug || slug, created.id);
  }

  if (Array.isArray(json.fields)) {
    for (const f of json.fields) {
      const moduleId = slugToModuleId.get(f.moduleSlug);
      if (!moduleId) continue;
      try {
        await createField(tenantId, moduleId, {
          label: f.label,
          fieldKey: f.fieldKey,
          fieldType: f.fieldType as "text" | "number" | "email" | "phone" | "textarea" | "dropdown" | "multi_select" | "checkbox" | "date" | "currency" | "file" | "boolean",
          orderIndex: f.orderIndex ?? 0,
          isRequired: f.isRequired ?? false,
          isUnique: f.isUnique ?? false,
          optionsJSON: f.optionsJSON ?? undefined,
          defaultValue: f.defaultValue ?? undefined,
        });
      } catch (e) {
        console.warn("[template] Skip field", f.fieldKey, e);
      }
    }
  }

  if (Array.isArray(json.pipelines)) {
    for (const p of json.pipelines) {
      const moduleId = slugToModuleId.get(p.moduleSlug);
      if (!moduleId) continue;
      const pipeline = await createPipeline(tenantId, { moduleId, name: p.name });
      if (Array.isArray(p.stages)) {
        for (const s of p.stages.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))) {
          await createStage(tenantId, {
            pipelineId: pipeline.id,
            stageName: s.stageName,
            orderIndex: s.orderIndex ?? 0,
          });
        }
      }
    }
  }

  if (Array.isArray(json.dashboards)) {
    for (const d of json.dashboards) {
      const dashboard = await createDashboard(tenantId, { name: d.name });
      if (Array.isArray(d.widgets)) {
        for (let i = 0; i < d.widgets.length; i++) {
          const w = d.widgets[i];
          try {
            await createWidget(tenantId, {
              dashboardId: dashboard.id,
              widgetType: w.widgetType,
              configJSON: w.configJSON ?? undefined,
              orderIndex: w.orderIndex ?? i,
            });
          } catch (e) {
            console.warn("[template] Skip widget", w.widgetType, e);
          }
        }
      }
    }
  }

  if (Array.isArray(json.roles)) {
    for (const r of json.roles) {
      try {
        await createRole(tenantId, {
          name: r.name,
          permissionsJSON: r.permissionsJSON ?? undefined,
        });
      } catch (e) {
        console.warn("[template] Skip role", r.name, e);
      }
    }
  }

  for (const slug of slugToModuleId.keys()) {
    const moduleId = slugToModuleId.get(slug);
    if (moduleId) await cacheDel(moduleMetadataKey(tenantId, moduleId));
  }

  return { installed: true };
}
