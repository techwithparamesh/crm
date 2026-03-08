/**
 * CRM template JSON structure for pre-built industry templates.
 * Supports two formats:
 * 1) Legacy: modules[], fields[] (with moduleSlug), pipelines[].stages as { stageName, orderIndex }
 * 2) Spec: modules[].fields[] (inline), pipelines[].stages as string[]
 */

export interface TemplateModuleDef {
  name: string;
  slug?: string;
  icon?: string;
  description?: string;
  /** Spec format: fields inline per module */
  fields?: TemplateFieldSpecDef[];
}

/** Field definition in spec format (e.g. options as string[]) */
export interface TemplateFieldSpecDef {
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  /** For type "relation": slug of the module to link to (e.g. "applicants") */
  relationModuleSlug?: string;
}

export interface TemplateFieldDef {
  moduleSlug: string;
  label: string;
  fieldKey?: string;
  fieldType: string;
  orderIndex?: number;
  isRequired?: boolean;
  isUnique?: boolean;
  optionsJSON?: string;
  defaultValue?: string;
  /** For fieldType "relation": resolved at install to target module id */
  relationModuleId?: string;
  /** For fieldType "relation": slug of target module (resolved to relationModuleId at install) */
  relationModuleSlug?: string;
}

export interface TemplateStageDef {
  stageName: string;
  orderIndex?: number;
}

export interface TemplatePipelineDef {
  /** Spec: module slug (e.g. "loans") */
  module?: string;
  moduleSlug?: string;
  moduleName?: string;
  name: string;
  /** Legacy: array of { stageName, orderIndex }; Spec: array of stage name strings */
  stages?: TemplateStageDef[] | string[];
  /** Spec: array of stage names in order */
  stageNames?: string[];
}

export interface TemplateWidgetDef {
  widgetType: string;
  configJSON?: string | null;
  orderIndex?: number;
}

export interface TemplateDashboardDef {
  name: string;
  widgets?: TemplateWidgetDef[];
}

export interface TemplateRoleDef {
  name: string;
  permissionsJSON?: string | null;
}

/** View definition per module (e.g. "All Leads", "My Pipeline") */
export interface TemplateViewDef {
  moduleSlug: string;
  name: string;
  viewType: string; // table | kanban | calendar | list
  configJSON?: string | null;
  orderIndex?: number;
}

/** Role–dashboard assignment: show this dashboard for this role */
export interface TemplateRoleDashboardDef {
  roleName: string;
  dashboardName: string;
  orderIndex?: number;
}

export interface CrmTemplateJSON {
  modules: TemplateModuleDef[];
  fields?: TemplateFieldDef[];
  pipelines?: TemplatePipelineDef[];
  dashboards?: TemplateDashboardDef[];
  views?: TemplateViewDef[];
  roles?: TemplateRoleDef[];
  roleDashboards?: TemplateRoleDashboardDef[];
}

/** Progress event for template install (streaming) */
export type TemplateInstallStep = "modules" | "fields" | "pipelines" | "dashboards" | "views" | "roles" | "relationships" | "done" | "error";

export interface TemplateInstallProgressEvent {
  step: TemplateInstallStep;
  message: string;
  current?: number;
  total?: number;
  done?: boolean;
  result?: { installed: boolean };
  error?: string;
}
