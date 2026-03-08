/**
 * Service layer for the Dynamic Multi-Tenant SaaS CRM (Business OS).
 * Use these from API routes and the template installer.
 */

export {
  installTemplateWithProgress,
  normalizeTemplateConfig,
  type ProgressCallback,
} from "./template-installer.service.js";

export * as moduleService from "../modules/modules/modules.service.js";
export * as fieldService from "../modules/fields/fields.service.js";
export * as pipelineService from "../modules/pipelines/pipelines.service.js";
export * as dashboardService from "../modules/dashboards/dashboards.service.js";
export * as automationService from "../modules/automations/automations.service.js";
export * as permissionService from "./permission.service.js";
