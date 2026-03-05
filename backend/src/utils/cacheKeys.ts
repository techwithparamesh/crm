/** Cache key prefixes and builders for Redis. TTL 5 min used in cache layer. */

export const CACHE_PREFIX = "crm:";

export function moduleMetadataKey(tenantId: string, moduleId: string): string {
  return `${CACHE_PREFIX}module:${tenantId}:${moduleId}`;
}

export function moduleListKey(tenantId: string): string {
  return `${CACHE_PREFIX}modules:${tenantId}`;
}

export function fieldDefinitionsKey(tenantId: string, moduleId: string): string {
  return `${CACHE_PREFIX}fields:${tenantId}:${moduleId}`;
}

export function pipelineStagesKey(tenantId: string, pipelineId: string): string {
  return `${CACHE_PREFIX}pipeline:${tenantId}:${pipelineId}`;
}

export function dashboardStatsKey(tenantId: string, dashboardId?: string): string {
  return dashboardId
    ? `${CACHE_PREFIX}dashboard:${tenantId}:${dashboardId}`
    : `${CACHE_PREFIX}dashboard:${tenantId}:all`;
}
