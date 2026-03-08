/**
 * Dynamic record CRUD — shared types.
 * Records are EAV: Record + RecordValue rows keyed by Field metadata.
 */

export interface RecordValueMap {
  [fieldKey: string]: unknown;
}

export interface RecordListItem {
  id: string;
  moduleId: string;
  tenantId: string;
  createdBy: string | null;
  ownerId?: string | null;
  pipelineStageId: string | null;
  createdAt: Date;
  updatedAt: Date;
  values: RecordValueMap;
  stage?: { id: string; stageName: string; orderIndex: number } | null;
}

export interface RecordDetail extends RecordListItem {
  module?: { name: string; slug: string };
  creator?: { id: string; name: string; email: string } | null;
  /** Resolved display labels for relation fields (fieldKey -> display string) */
  relationDisplay?: Record<string, string>;
  /** Resolved display labels for user fields (fieldKey -> user name) */
  userDisplay?: Record<string, string>;
}

export interface ListRecordsResult {
  items: RecordListItem[];
  total: number;
  page: number;
  limit: number;
}
