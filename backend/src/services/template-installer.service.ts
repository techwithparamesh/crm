/**
 * Template Installer Service — Orchestrates CRM template installation with progress.
 * Supports both legacy config (fields[], stages as objects) and spec config (modules[].fields, stages as string[]).
 */

import { prisma } from "../prisma/client.js";
import { createModule } from "../modules/modules/modules.service.js";
import { createField } from "../modules/fields/fields.service.js";
import { createPipeline, createStage } from "../modules/pipelines/pipelines.service.js";
import { createDashboard, createWidget } from "../modules/dashboards/dashboards.service.js";
import { createRole } from "../modules/roles/roles.service.js";
import { cacheDel } from "../utils/redis.js";
import { moduleMetadataKey } from "../utils/cacheKeys.js";
import type {
  CrmTemplateJSON,
  TemplateModuleDef,
  TemplateFieldDef,
  TemplatePipelineDef,
  TemplateStageDef,
  TemplateInstallProgressEvent,
  TemplateFieldSpecDef,
} from "../modules/crm-templates/templates.types.js";

const FIELD_TYPES = [
  "text", "textarea", "number", "email", "phone", "date", "currency",
  "checkbox", "select", "multiselect", "file", "relation", "user",
] as const;

function slugFromName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_-]/g, "");
}

function fieldKeyFromLabel(label: string): string {
  return label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function mapFieldType(specType: string): string {
  const m: Record<string, string> = {
    select: "dropdown",
    multiselect: "multi_select",
  };
  return m[specType] ?? specType;
}

/** Normalize spec format (modules[].fields, stageNames) to internal format */
export function normalizeTemplateConfig(json: CrmTemplateJSON): {
  modules: Array<TemplateModuleDef & { slug: string }>;
  fields: Array<TemplateFieldDef & { moduleSlug: string }>;
  pipelines: Array<TemplatePipelineDef & { moduleSlug: string; stages: { stageName: string; orderIndex: number }[] }>;
  dashboards: CrmTemplateJSON["dashboards"];
  roles: CrmTemplateJSON["roles"];
} {
  const modules: Array<TemplateModuleDef & { slug: string }> = json.modules.map((m) => ({
    ...m,
    slug: m.slug ?? slugFromName(m.name),
  }));

  const fields: Array<TemplateFieldDef & { moduleSlug: string }> = [];

  if (json.fields?.length) {
    fields.push(...json.fields.map((f) => ({
      ...f,
      moduleSlug: f.moduleSlug,
      fieldKey: f.fieldKey ?? fieldKeyFromLabel(f.label),
    })));
  }

  for (const mod of json.modules) {
    const slug = mod.slug ?? slugFromName(mod.name);
    if (!mod.fields?.length) continue;
    for (let i = 0; i < mod.fields.length; i++) {
      const f = mod.fields[i] as TemplateFieldSpecDef;
      const optionsJSON = Array.isArray(f.options) ? JSON.stringify(f.options) : undefined;
      const fieldType = mapFieldType(f.type ?? "text");
      const row: TemplateFieldDef & { moduleSlug: string } = {
        moduleSlug: slug,
        label: f.label,
        fieldKey: fieldKeyFromLabel(f.label),
        fieldType,
        orderIndex: i,
        isRequired: f.required ?? false,
        optionsJSON,
      };
      if (fieldType === "relation" && f.relationModuleSlug) {
        row.relationModuleSlug = f.relationModuleSlug;
      }
      fields.push(row);
    }
  }

  const pipelines: Array<TemplatePipelineDef & { moduleSlug: string; stages: { stageName: string; orderIndex: number }[] }> = (json.pipelines ?? []).map((p) => {
    const moduleSlug = (p as { module?: string }).module ?? p.moduleSlug ?? (p.moduleName ? slugFromName(p.moduleName) : "");
    let stages: { stageName: string; orderIndex: number }[];
    if (p.stageNames?.length) {
      stages = p.stageNames.map((name, i) => ({ stageName: name, orderIndex: i }));
    } else if (Array.isArray(p.stages)) {
      if (p.stages.length > 0 && typeof p.stages[0] === "string") {
        stages = (p.stages as string[]).map((name, i) => ({ stageName: name, orderIndex: i }));
      } else {
        stages = (p.stages as TemplateStageDef[]).map((s, i) => ({ stageName: s.stageName, orderIndex: s.orderIndex ?? i }));
      }
    } else {
      stages = [];
    }
    return { ...p, moduleSlug, stages };
  });

  return {
    modules,
    fields,
    pipelines,
    dashboards: json.dashboards ?? [],
    views: json.views ?? [],
    roles: json.roles ?? [],
    roleDashboards: json.roleDashboards ?? [],
  };
}

export type ProgressCallback = (event: TemplateInstallProgressEvent) => void;

export async function installTemplateWithProgress(
  templateId: string,
  workspaceId: string,
  onProgress: ProgressCallback
): Promise<{ installed: boolean }> {
  const tenantId = workspaceId;

  const template = await prisma.crmTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new Error("Template not found");

  let json: CrmTemplateJSON;
  try {
    json = JSON.parse(template.templateJSON) as CrmTemplateJSON;
  } catch {
    throw new Error("Invalid template JSON");
  }

  const { modules, fields, pipelines, dashboards, views, roles, roleDashboards } = normalizeTemplateConfig(json);

  if (!modules.length) {
    throw new Error("Template has no modules");
  }

  const slugToModuleId = new Map<string, string>();

  onProgress({ step: "modules", message: "Installing modules", current: 0, total: modules.length });

  for (let i = 0; i < modules.length; i++) {
    const mod = modules[i];
    const existing = await prisma.module.findFirst({
      where: { tenantId, slug: mod.slug },
    });
    if (existing) {
      slugToModuleId.set(mod.slug, existing.id);
    } else {
      const created = await createModule(tenantId, {
        name: mod.name,
        slug: mod.slug,
        icon: mod.icon ?? "folder",
        description: mod.description ?? undefined,
        isTemplate: true,
        orderIndex: i,
      });
      slugToModuleId.set(mod.slug, created.id);
    }
    onProgress({ step: "modules", message: "Installing modules", current: i + 1, total: modules.length });
  }

  const fieldList = fields.filter((f) => slugToModuleId.has(f.moduleSlug));
  onProgress({ step: "fields", message: "Creating fields", current: 0, total: fieldList.length });

  for (let i = 0; i < fieldList.length; i++) {
    const f = fieldList[i];
    const moduleId = slugToModuleId.get(f.moduleSlug)!;
    try {
      const existing = await prisma.field.findFirst({
        where: { moduleId, fieldKey: f.fieldKey ?? fieldKeyFromLabel(f.label) },
      });
      if (!existing) {
        const relationModuleId = (f as { relationModuleSlug?: string }).relationModuleSlug
          ? slugToModuleId.get((f as { relationModuleSlug?: string }).relationModuleSlug!) ?? undefined
          : (f as { relationModuleId?: string }).relationModuleId;
        await createField(tenantId, moduleId, {
          label: f.label,
          fieldKey: f.fieldKey ?? fieldKeyFromLabel(f.label),
          fieldType: f.fieldType as "text" | "number" | "email" | "phone" | "textarea" | "dropdown" | "multi_select" | "checkbox" | "date" | "currency" | "file" | "boolean" | "relation" | "user",
          orderIndex: f.orderIndex ?? 0,
          isRequired: f.isRequired ?? false,
          isUnique: f.isUnique ?? false,
          isSystem: true,
          optionsJSON: f.optionsJSON ?? undefined,
          defaultValue: f.defaultValue ?? undefined,
          relationModuleId: relationModuleId ?? undefined,
        });
      }
    } catch (e) {
      console.warn("[template] Skip field", f.label, e);
    }
    onProgress({ step: "fields", message: "Creating fields", current: i + 1, total: fieldList.length });
  }

  onProgress({ step: "pipelines", message: "Setting pipelines", current: 0, total: pipelines.length });

  for (let i = 0; i < pipelines.length; i++) {
    const p = pipelines[i];
    const moduleId = p.moduleSlug ? slugToModuleId.get(p.moduleSlug) : undefined;
    if (!moduleId) continue;
    let pipeline = await prisma.pipeline.findFirst({
      where: { tenantId, moduleId, name: p.name },
    });
    if (!pipeline) {
      pipeline = await createPipeline(tenantId, { moduleId, name: p.name });
    }
    const sortedStages = [...(p.stages ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
    for (const s of sortedStages) {
      const exists = await prisma.pipelineStage.findFirst({
        where: { pipelineId: pipeline!.id, stageName: s.stageName },
      });
      if (!exists) {
        await createStage(tenantId, {
          pipelineId: pipeline!.id,
          stageName: s.stageName,
          orderIndex: s.orderIndex,
        });
      }
    }
    onProgress({ step: "pipelines", message: "Creating pipelines", current: i + 1, total: pipelines.length });
  }

  onProgress({ step: "dashboards", message: "Preparing dashboards", current: 0, total: dashboards.length });

  const dashboardNameToId = new Map<string, string>();
  for (let i = 0; i < dashboards.length; i++) {
    const d = dashboards[i];
    const dashboard = await createDashboard(tenantId, { name: d.name });
    dashboardNameToId.set(d.name, dashboard.id);
    if (d.widgets?.length) {
      for (let wi = 0; wi < d.widgets.length; wi++) {
        const w = d.widgets[wi];
        try {
          await createWidget(tenantId, {
            dashboardId: dashboard.id,
            widgetType: w.widgetType,
            configJSON: w.configJSON ?? undefined,
            orderIndex: w.orderIndex ?? wi,
          });
        } catch (e) {
          console.warn("[template] Skip widget", w.widgetType, e);
        }
      }
    }
    onProgress({ step: "dashboards", message: "Preparing dashboards", current: i + 1, total: dashboards.length });
  }

  if (views?.length) {
    onProgress({ step: "views", message: "Creating views", current: 0, total: views.length });
    for (let i = 0; i < views.length; i++) {
      const v = views[i];
      const moduleId = slugToModuleId.get(v.moduleSlug);
      if (moduleId) {
        try {
          const existing = await prisma.view.findFirst({
            where: { moduleId, name: v.name },
          });
          if (!existing) {
            await prisma.view.create({
              data: {
                moduleId,
                name: v.name,
                viewType: v.viewType,
                configJSON: v.configJSON ?? null,
                orderIndex: v.orderIndex ?? i,
              },
            });
          }
        } catch (e) {
          console.warn("[template] Skip view", v.moduleSlug, v.name, e);
        }
      }
      onProgress({ step: "views", message: "Creating views", current: i + 1, total: views.length });
    }
  }

  const roleNameToId = new Map<string, string>();
  if (roles?.length) {
    onProgress({ step: "roles", message: "Creating roles", current: 0, total: roles.length });
    for (let i = 0; i < roles.length; i++) {
      const r = roles[i];
      try {
        const role = await createRole(tenantId, {
          name: r.name,
          permissionsJSON: r.permissionsJSON ?? undefined,
        });
        roleNameToId.set(r.name, role.id);
      } catch (e) {
        const existing = await prisma.role.findFirst({ where: { tenantId, name: r.name } });
        if (existing) roleNameToId.set(r.name, existing.id);
      }
      onProgress({ step: "roles", message: "Creating roles", current: i + 1, total: roles.length });
    }
  }

  if (roleDashboards?.length) {
    for (const rd of roleDashboards) {
      const roleId = roleNameToId.get(rd.roleName);
      const dashboardId = dashboardNameToId.get(rd.dashboardName);
      if (roleId && dashboardId) {
        try {
          await prisma.roleDashboard.create({
            data: {
              tenantId,
              roleId,
              dashboardId,
              orderIndex: rd.orderIndex ?? 0,
            },
          });
        } catch (e) {
          console.warn("[template] Skip roleDashboard", rd.roleName, rd.dashboardName, e);
        }
      }
    }
  }

  for (const slug of slugToModuleId.keys()) {
    const moduleId = slugToModuleId.get(slug);
    if (moduleId) await cacheDel(moduleMetadataKey(tenantId, moduleId));
  }

  onProgress({ step: "done", message: "Template installed", done: true, result: { installed: true } });
  return { installed: true };
}
