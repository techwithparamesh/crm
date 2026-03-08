import { prisma } from "../../prisma/client.js";
import { cacheGetOrSet, cacheDel } from "../../utils/redis.js";
import { pipelineStagesKey } from "../../utils/cacheKeys.js";
import { fireAutomations } from "../automations/automation-engine.js";
import { logActivity } from "../activity-log/activity-log.service.js";
import { createNotification } from "../notifications/notifications.service.js";
import { dispatchWebhooks } from "../webhooks/webhook-dispatcher.js";
import type { CreatePipelineInput, UpdatePipelineInput, CreateStageInput } from "./pipelines.validation.js";

export async function createPipeline(tenantId: string, input: CreatePipelineInput) {
  const module = await prisma.module.findFirst({ where: { id: input.moduleId, tenantId } });
  if (!module) throw new Error("Module not found");
  return prisma.pipeline.create({
    data: { tenantId, moduleId: input.moduleId, name: input.name },
  });
}

export async function listPipelines(tenantId: string) {
  return prisma.pipeline.findMany({
    where: { tenantId },
    include: { module: true, stages: { orderBy: { orderIndex: "asc" } } },
  });
}

export async function updatePipeline(tenantId: string, id: string, input: UpdatePipelineInput) {
  const p = await prisma.pipeline.findFirst({ where: { id, tenantId } });
  if (!p) throw new Error("Pipeline not found");
  const updated = await prisma.pipeline.update({
    where: { id },
    data: input,
  });
  await cacheDel(pipelineStagesKey(tenantId, id));
  return updated;
}

export async function deletePipeline(tenantId: string, id: string) {
  const p = await prisma.pipeline.findFirst({ where: { id, tenantId } });
  if (!p) throw new Error("Pipeline not found");
  await prisma.pipeline.delete({ where: { id } });
  await cacheDel(pipelineStagesKey(tenantId, id));
}

export async function getPipelineById(tenantId: string, id: string) {
  return cacheGetOrSet(pipelineStagesKey(tenantId, id), async () => {
    const p = await prisma.pipeline.findFirst({
      where: { id, tenantId },
      include: { module: true, stages: { orderBy: { orderIndex: "asc" } } },
    });
    if (!p) throw new Error("Pipeline not found");
    return p;
  });
}

export async function createStage(tenantId: string, input: CreateStageInput) {
  const pipeline = await prisma.pipeline.findFirst({
    where: { id: input.pipelineId, tenantId },
  });
  if (!pipeline) throw new Error("Pipeline not found");
  const maxOrder = await prisma.pipelineStage.aggregate({
    where: { pipelineId: input.pipelineId },
    _max: { orderIndex: true },
  });
  const orderIndex = input.orderIndex ?? (maxOrder._max.orderIndex ?? -1) + 1;
  const stage = await prisma.pipelineStage.create({
    data: { pipelineId: input.pipelineId, stageName: input.stageName, orderIndex },
  });
  await cacheDel(pipelineStagesKey(tenantId, input.pipelineId));
  return stage;
}

export async function updateRecordStage(
  tenantId: string,
  recordId: string,
  stageId: string,
  userId?: string | null
) {
  const record = await prisma.record.findFirst({
    where: { id: recordId, tenantId },
    include: { module: true },
  });
  if (!record) throw new Error("Record not found");
  const stage = await prisma.pipelineStage.findFirst({
    where: { id: stageId },
    include: { pipeline: true },
  });
  if (!stage || stage.pipeline.tenantId !== tenantId || stage.pipeline.moduleId !== record.moduleId)
    throw new Error("Invalid pipeline stage");
  const previousStageId = record.pipelineStageId;
  const previousStage = previousStageId
    ? await prisma.pipelineStage.findUnique({ where: { id: previousStageId } })
    : null;
  await prisma.record.update({
    where: { id: recordId },
    data: { pipelineStageId: stageId },
  });
  const updated = await prisma.record.findUniqueOrThrow({
    where: { id: recordId },
    include: { stage: true, values: { include: { field: true } } },
  });
  const recordValues: Record<string, unknown> = {};
  for (const v of updated.values) {
    if (v.valueText != null) recordValues[v.field.fieldKey] = v.valueText;
    else if (v.valueNumber != null) recordValues[v.field.fieldKey] = v.valueNumber;
    else if (v.valueDate != null) recordValues[v.field.fieldKey] = v.valueDate.toISOString();
    else if (v.valueJSON != null) try { recordValues[v.field.fieldKey] = JSON.parse(v.valueJSON); } catch { recordValues[v.field.fieldKey] = v.valueJSON; }
  }
  logActivity({
    tenantId,
    recordId,
    userId: userId ?? null,
    eventType: "stage_changed",
    metadata: {
      newStageId: stageId,
      newStageName: stage.stageName,
      previousStageId: previousStageId ?? undefined,
      previousStageName: previousStage?.stageName,
    },
  }).catch(() => {});
  fireAutomations("stage_changed", {
    tenantId,
    moduleId: record.moduleId,
    recordId,
    payload: { previousStageId, newStageId: stageId },
  }, recordValues).catch(() => {});
  dispatchWebhooks(tenantId, "stage_changed", {
    module: record.module.slug,
    moduleId: record.moduleId,
    recordId,
    tenantId,
    data: {
      ...recordValues,
      previousStageId: previousStageId ?? undefined,
      previousStageName: previousStage?.stageName,
      newStageId: stageId,
      newStageName: stage.stageName,
    },
  }).catch(() => {});
  if (record.createdBy && record.createdBy !== userId) {
    createNotification({
      tenantId,
      userId: record.createdBy,
      type: "stage_changed",
      title: "Record moved",
      message: `${record.module.name}: ${previousStage?.stageName ?? "No stage"} → ${stage.stageName}`,
      entityType: "record",
      entityId: recordId,
      metadataJSON: JSON.stringify({ newStageId: stageId, newStageName: stage.stageName }),
    }).catch(() => {});
  }
  return updated;
}
