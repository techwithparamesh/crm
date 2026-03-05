import { prisma } from "../../prisma/client.js";
import type { CreateRecordRelationInput } from "./record-relations.validation.js";

export async function getRelatedRecords(tenantId: string, recordId: string) {
  const record = await prisma.record.findFirst({
    where: { id: recordId, tenantId },
    include: { module: true },
  });
  if (!record) throw new Error("Record not found");

  const relations = await prisma.recordRelation.findMany({
    where: {
      OR: [{ sourceRecordId: recordId }, { targetRecordId: recordId }],
      relationship: { tenantId },
    },
    include: {
      relationship: { include: { sourceModule: true, targetModule: true } },
      sourceRecord: { include: { module: true, values: { include: { field: true } } } },
      targetRecord: { include: { module: true, values: { include: { field: true } } } },
    },
  });

  const result: Array<{
    id: string;
    relationshipId: string;
    relationshipName: string;
    relationshipType: string;
    thisRole: "source" | "target";
    relatedRecord: { id: string; moduleId: string; moduleName: string; values: Record<string, unknown> };
  }> = [];

  for (const r of relations) {
    const isSource = r.sourceRecordId === recordId;
    const related = isSource ? r.targetRecord : r.sourceRecord;
    const thisRole = isSource ? "source" : "target";
    result.push({
      id: r.id,
      relationshipId: r.relationshipId,
      relationshipName: r.relationship.name,
      relationshipType: r.relationship.relationshipType,
      thisRole,
      relatedRecord: {
        id: related.id,
        moduleId: related.moduleId,
        moduleName: related.module.name,
        values: mapValues(related),
      },
    });
  }

  return result;
}

export async function linkRecords(tenantId: string, input: CreateRecordRelationInput) {
  const rel = await prisma.moduleRelationship.findFirst({
    where: { id: input.relationshipId, tenantId },
    include: { sourceModule: true, targetModule: true },
  });
  if (!rel) throw new Error("Relationship not found");

  const [sourceRecord, targetRecord] = await Promise.all([
    prisma.record.findFirst({ where: { id: input.sourceRecordId, tenantId } }),
    prisma.record.findFirst({ where: { id: input.targetRecordId, tenantId } }),
  ]);
  if (!sourceRecord) throw new Error("Source record not found");
  if (!targetRecord) throw new Error("Target record not found");
  if (sourceRecord.moduleId !== rel.sourceModuleId) throw new Error("Source record does not belong to relationship source module");
  if (targetRecord.moduleId !== rel.targetModuleId) throw new Error("Target record does not belong to relationship target module");

  const existing = await prisma.recordRelation.findFirst({
    where: {
      relationshipId: input.relationshipId,
      sourceRecordId: input.sourceRecordId,
      targetRecordId: input.targetRecordId,
    },
  });
  if (existing) throw new Error("Records are already linked");

  return prisma.recordRelation.create({
    data: {
      relationshipId: input.relationshipId,
      sourceRecordId: input.sourceRecordId,
      targetRecordId: input.targetRecordId,
    },
    include: { relationship: true, sourceRecord: true, targetRecord: true },
  });
}

export async function unlinkRecords(tenantId: string, relationId: string) {
  const rel = await prisma.recordRelation.findFirst({
    where: { id: relationId },
    include: { relationship: true },
  });
  if (!rel || rel.relationship.tenantId !== tenantId) throw new Error("Link not found");
  return prisma.recordRelation.delete({ where: { id: relationId } });
}

export async function getRecordRelationId(
  tenantId: string,
  relationshipId: string,
  sourceRecordId: string,
  targetRecordId: string
) {
  const r = await prisma.recordRelation.findFirst({
    where: {
      relationshipId,
      sourceRecordId,
      targetRecordId,
      relationship: { tenantId },
    },
  });
  return r?.id ?? null;
}

function mapValues(record: {
  values: Array<{
    field: { fieldKey: string };
    valueText: string | null;
    valueNumber: number | null;
    valueDate: Date | null;
    valueJSON: string | null;
  }>;
}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const v of record.values) {
    if (v.valueText != null) out[v.field.fieldKey] = v.valueText;
    else if (v.valueNumber != null) out[v.field.fieldKey] = v.valueNumber;
    else if (v.valueDate != null) out[v.field.fieldKey] = v.valueDate.toISOString();
    else if (v.valueJSON != null) {
      try {
        out[v.field.fieldKey] = JSON.parse(v.valueJSON);
      } catch {
        out[v.field.fieldKey] = v.valueJSON;
      }
    }
  }
  return out;
}
