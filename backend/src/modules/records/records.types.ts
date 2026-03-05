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
  pipelineStageId: string | null;
  createdAt: Date;
  updatedAt: Date;
  values: RecordValueMap;
  stage?: { id: string; stageName: string; orderIndex: number } | null;
}

export interface RecordDetail extends RecordListItem {
  module?: { name: string; slug: string };
  creator?: { id: string; name: string; email: string } | null;
}

export interface ListRecordsResult {
  items: RecordListItem[];
  total: number;
  page: number;
  limit: number;
}
