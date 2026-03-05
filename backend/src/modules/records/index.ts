/**
 * Dynamic record CRUD module.
 * EAV storage keyed by module/field metadata.
 */

export {
  createRecord,
  listRecords,
  getRecordDetail,
  updateRecord,
  deleteRecord,
} from "./records.service.js";

export type { RecordValueMap, RecordListItem, RecordDetail, ListRecordsResult } from "./records.types.js";
export { getValueColumn, normalizeValue, buildRecordValuePayload } from "./record-values.js";
export type { ValueColumn, NormalizedValue } from "./record-values.js";
