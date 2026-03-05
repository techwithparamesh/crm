/**
 * Dynamic record CRUD service.
 * Stores and retrieves record data via EAV (Record + RecordValue) keyed by module/field metadata.
 */

import { prisma } from "../../prisma/client.js";
import { fireAutomations } from "../automations/automation-engine.js";
import { logActivity } from "../activity-log/activity-log.service.js";
import { createAuditLog } from "../audit-log/audit-log.service.js";
import { createNotification } from "../notifications/notifications.service.js";
import { dispatchWebhooks } from "../webhooks/webhook-dispatcher.js";
import {
  canAccessModule,
  canViewRecord,
  canEditRecord,
  canDeleteRecord,
  type RolePermissions,
} from "../../utils/permissions.js";
import { PermissionDeniedError } from "./records.permissions.js";
import type { CreateRecordInput, UpdateRecordInput, ListRecordsQuery } from "./records.validation.js";
import type { RecordDetail, RecordListItem, ListRecordsResult } from "./records.types.js";
import { mergeWhere } from "../../utils/tenantScopedRepository.js";
import { normalizeValue, buildRecordValuePayload } from "./record-values.js";
import { validateValuesForCreate, validateValuesForUpdate } from "./record-validation.js";

export interface RecordPermissionContext {
  permissions: RolePermissions | null;
  userId: string;
}

// ---------- Create ----------

export async function createRecord(
  tenantId: string,
  moduleId: string,
  createdBy: string | null,
  input: CreateRecordInput,
  perm?: RecordPermissionContext
): Promise<RecordDetail> {
  if (perm && !canAccessModule(perm.permissions, moduleId, "create")) {
    throw new PermissionDeniedError("No create access to this module");
  }
  const module = await prisma.module.findFirst({
    where: { id: moduleId, tenantId },
    include: { fields: { orderBy: { orderIndex: "asc" } } },
  });
  if (!module) throw new Error("Module not found");

  const values = input.values ?? {};
  await validateValuesForCreate(tenantId, moduleId, values);

  if (input.pipelineStageId) {
    const stage = await prisma.pipelineStage.findFirst({
      where: { id: input.pipelineStageId },
      include: { pipeline: true },
    });
    if (!stage || stage.pipeline.tenantId !== tenantId || stage.pipeline.moduleId !== moduleId) {
      throw new Error("Invalid pipeline stage");
    }
  }

  const record = await prisma.$transaction(async (tx) => {
    const rec = await tx.record.create({
      data: {
        moduleId,
        tenantId,
        createdBy,
        pipelineStageId: input.pipelineStageId ?? undefined,
      },
    });

    for (const field of module.fields) {
      const raw = values[field.fieldKey];
      const def = field.defaultValue ?? null;
      const value = raw !== undefined && raw !== null && raw !== "" ? raw : (def !== null ? def : null);
      if (value === null) continue;

      const normalized = normalizeValue(field.fieldType, value);
      const payload = buildRecordValuePayload(field.fieldType, normalized);

      await tx.recordValue.create({
        data: {
          recordId: rec.id,
          fieldId: field.id,
          ...payload,
        },
      });
    }
    return rec;
  });

  const detail = await getRecordDetail(tenantId, record.id);
  logActivity({
    tenantId,
    recordId: record.id,
    userId: createdBy,
    eventType: "record_created",
  }).catch(() => {});
  fireAutomations(
    "record_created",
    { tenantId, moduleId, recordId: record.id, userId: createdBy ?? undefined },
    detail.values
  ).catch(() => {});
  dispatchWebhooks(tenantId, "record_created", {
    module: module.slug,
    moduleId,
    recordId: record.id,
    tenantId,
    data: detail.values as Record<string, unknown>,
  }).catch(() => {});
  createAuditLog({
    tenantId,
    userId: createdBy,
    action: "record_created",
    entityType: "record",
    entityId: record.id,
    metadataJSON: JSON.stringify({ moduleId, moduleSlug: module.slug }),
  }).catch(() => {});
  if (createdBy) {
    createNotification({
      tenantId,
      userId: createdBy,
      type: "record_created",
      title: "Record created",
      message: `New record in ${module.name}`,
      entityType: "record",
      entityId: record.id,
      metadataJSON: JSON.stringify({ moduleId, moduleSlug: module.slug }),
    }).catch(() => {});
  }
  return detail;
}

// ---------- List ----------

export async function listRecords(
  tenantId: string,
  moduleId: string,
  query: ListRecordsQuery,
  perm?: RecordPermissionContext
): Promise<ListRecordsResult> {
  if (perm && !canAccessModule(perm.permissions, moduleId, "view")) {
    throw new PermissionDeniedError("No view access to this module");
  }
  const module = await prisma.module.findFirst({ where: { id: moduleId, tenantId } });
  if (!module) throw new Error("Module not found");

  const where: { moduleId: string; tenantId: string; pipelineStageId?: string; createdBy?: string } = {
    moduleId,
    tenantId,
  };
  if (query.stageId) where.pipelineStageId = query.stageId;
  if (perm?.permissions?.recordVisibility === "own") where.createdBy = perm.userId;

  const [records, total] = await Promise.all([
    prisma.record.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        values: { include: { field: true } },
        stage: true,
      },
    }),
    prisma.record.count({ where }),
  ]);

  const items = records.map((r) => mapRecordToValues(r)) as RecordListItem[];
  return { items, total, page: query.page, limit: query.limit };
}

// ---------- Get one ----------

export async function getRecordDetail(
  tenantId: string,
  recordId: string,
  perm?: RecordPermissionContext
): Promise<RecordDetail> {
  const record = await prisma.record.findFirst({
    where: { id: recordId, tenantId },
    include: {
      module: true,
      values: { include: { field: true } },
      stage: true,
      creator: true,
    },
  });
  if (!record) throw new Error("Record not found");
  if (perm && !canViewRecord(perm.permissions, record.moduleId, record.createdBy, perm.userId)) {
    throw new PermissionDeniedError("No view access to this record");
  }
  return mapRecordToValues(record) as RecordDetail;
}

// ---------- Update ----------

export async function updateRecord(
  tenantId: string,
  recordId: string,
  userId: string | null,
  input: UpdateRecordInput,
  perm?: RecordPermissionContext
): Promise<RecordDetail> {
  const record = await prisma.record.findFirst({
    where: { id: recordId, tenantId },
    include: { module: { include: { fields: true } } },
  });
  if (!record) throw new Error("Record not found");
  if (perm && !canEditRecord(perm.permissions, record.moduleId, record.createdBy, perm.userId)) {
    throw new PermissionDeniedError("No edit access to this record");
  }

  if (input.values && Object.keys(input.values).length > 0) {
    await validateValuesForUpdate(tenantId, record.moduleId, recordId, input.values);
  }

  if (input.pipelineStageId !== undefined) {
    if (input.pipelineStageId) {
      const stage = await prisma.pipelineStage.findFirst({
        where: { id: input.pipelineStageId },
        include: { pipeline: true },
      });
      if (
        !stage ||
        stage.pipeline.tenantId !== tenantId ||
        stage.pipeline.moduleId !== record.moduleId
      ) {
        throw new Error("Invalid pipeline stage");
      }
    }
    await prisma.record.update({
      where: { id: recordId },
      data: { pipelineStageId: input.pipelineStageId ?? null },
    });
  }

  if (input.values && Object.keys(input.values).length > 0) {
    const fieldMap = new Map(record.module.fields.map((f) => [f.fieldKey, f]));
    for (const [fieldKey, value] of Object.entries(input.values)) {
      const field = fieldMap.get(fieldKey);
      if (!field) continue;
      const normalized = normalizeValue(field.fieldType, value);
      const payload = buildRecordValuePayload(field.fieldType, normalized);

      await prisma.recordValue.upsert({
        where: {
          recordId_fieldId: { recordId, fieldId: field.id },
        },
        create: {
          recordId,
          fieldId: field.id,
          ...payload,
        },
        update: payload,
      });
    }
  }

  const detail = await getRecordDetail(tenantId, recordId);
  logActivity({
    tenantId,
    recordId,
    userId,
    eventType: "record_updated",
  }).catch(() => {});
  const notesFieldKey = record.module.fields.find((f) => f.fieldKey === "notes")?.fieldKey;
  if (notesFieldKey && input.values && Object.prototype.hasOwnProperty.call(input.values, notesFieldKey)) {
    logActivity({
      tenantId,
      recordId,
      userId,
      eventType: "note_added",
    }).catch(() => {});
  }
  fireAutomations(
    "record_updated",
    { tenantId, moduleId: record.moduleId, recordId, userId: userId ?? undefined },
    detail.values
  ).catch(() => {});
  dispatchWebhooks(tenantId, "record_updated", {
    module: record.module.slug,
    moduleId: record.moduleId,
    recordId,
    tenantId,
    data: detail.values as Record<string, unknown>,
  }).catch(() => {});
  createAuditLog({
    tenantId,
    userId,
    action: "record_updated",
    entityType: "record",
    entityId: recordId,
    metadataJSON: JSON.stringify({ moduleId: record.moduleId, moduleSlug: record.module.slug }),
  }).catch(() => {});
  return detail;
}

// ---------- Delete ----------

export async function deleteRecord(
  tenantId: string,
  recordId: string,
  perm?: RecordPermissionContext
): Promise<void> {
  const record = await prisma.record.findFirst({
    where: { id: recordId, tenantId },
    include: { module: true },
  });
  if (!record) throw new Error("Record not found");
  if (perm && !canDeleteRecord(perm.permissions, record.moduleId, record.createdBy, perm.userId)) {
    throw new PermissionDeniedError("No delete access to this record");
  }
  const detail = await getRecordDetail(tenantId, recordId).catch(() => null);
  dispatchWebhooks(tenantId, "record_deleted", {
    module: record.module.slug,
    moduleId: record.moduleId,
    recordId,
    tenantId,
    data: (detail?.values ?? {}) as Record<string, unknown>,
  }).catch(() => {});
  createAuditLog({
    tenantId,
    userId: perm?.userId ?? null,
    action: "record_deleted",
    entityType: "record",
    entityId: recordId,
    metadataJSON: JSON.stringify({ moduleId: record.moduleId, moduleSlug: record.module.slug }),
  }).catch(() => {});
  await prisma.record.deleteMany({ where: mergeWhere(tenantId, { id: recordId }) });
}

// ---------- Map EAV rows to keyed values ----------

function mapRecordToValues(record: {
  id: string;
  moduleId: string;
  tenantId: string;
  createdBy: string | null;
  pipelineStageId: string | null;
  createdAt: Date;
  updatedAt: Date;
  module?: { name: string; slug: string };
  values: Array<{
    field: { fieldKey: string; fieldType: string };
    valueText: string | null;
    valueNumber: number | null;
    valueDate: Date | null;
    valueJSON: string | null;
  }>;
  stage?: { id: string; stageName: string; orderIndex: number } | null;
  creator?: { id: string; name: string; email: string } | null;
}): RecordListItem | RecordDetail {
  const values: Record<string, unknown> = {};
  for (const v of record.values) {
    if (v.valueText != null) values[v.field.fieldKey] = v.valueText;
    else if (v.valueNumber != null) values[v.field.fieldKey] = v.valueNumber;
    else if (v.valueDate != null) values[v.field.fieldKey] = v.valueDate.toISOString();
    else if (v.valueJSON != null) {
      try {
        values[v.field.fieldKey] = JSON.parse(v.valueJSON);
      } catch {
        values[v.field.fieldKey] = v.valueJSON;
      }
    }
  }
  return {
    id: record.id,
    moduleId: record.moduleId,
    tenantId: record.tenantId,
    createdBy: record.createdBy,
    pipelineStageId: record.pipelineStageId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    values,
    module: record.module,
    stage: record.stage,
    creator: record.creator,
  };
}
