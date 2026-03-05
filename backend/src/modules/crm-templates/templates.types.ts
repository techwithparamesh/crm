/**
 * CRM template JSON structure for pre-built industry templates.
 */

export interface TemplateModuleDef {
  name: string;
  slug: string;
  icon?: string;
  description?: string;
}

export interface TemplateFieldDef {
  moduleSlug: string;
  label: string;
  fieldKey: string;
  fieldType: string;
  orderIndex?: number;
  isRequired?: boolean;
  isUnique?: boolean;
  optionsJSON?: string;
  defaultValue?: string;
}

export interface TemplateStageDef {
  stageName: string;
  orderIndex: number;
}

export interface TemplatePipelineDef {
  moduleSlug: string;
  name: string;
  stages: TemplateStageDef[];
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

export interface CrmTemplateJSON {
  modules: TemplateModuleDef[];
  fields?: TemplateFieldDef[];
  pipelines?: TemplatePipelineDef[];
  dashboards?: TemplateDashboardDef[];
  roles?: TemplateRoleDef[];
}
