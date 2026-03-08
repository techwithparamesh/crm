/**
 * Search index: maintain SearchIndex table for global search.
 * Called when records are created, updated, or deleted.
 */

import { prisma } from "../../prisma/client.js";

const SEARCHABLE_FIELD_TYPES = ["text", "textarea", "email", "phone", "select"];
const MAX_TITLE_LEN = 500;
const MAX_CONTENT_LEN = 50_000;

/**
 * Build title (first line / primary text) and content (all searchable text) from record values.
 */
function buildTitleAndContent(
  values: Array<{ field: { fieldKey: string; fieldType: string }; valueText: string | null; valueJSON: string | null }>
): { title: string; content: string } {
  const parts: string[] = [];
  let title = "";
  for (const v of values) {
    if (!SEARCHABLE_FIELD_TYPES.includes(v.field.fieldType)) continue;
    const text =
      v.valueText ?? (v.valueJSON ? String(v.valueJSON).replace(/^"|"$/g, "") : null);
    if (text && text.trim()) {
      parts.push(text.trim());
      if (!title && text.length <= MAX_TITLE_LEN) title = text.trim();
    }
  }
  if (!title && parts.length) title = parts[0].slice(0, MAX_TITLE_LEN);
  const content = parts.join(" ").slice(0, MAX_CONTENT_LEN);
  return { title: title.slice(0, MAX_TITLE_LEN) || "Record", content };
}

/**
 * Index a single record into SearchIndex (upsert by recordId).
 */
export async function indexRecord(tenantId: string, recordId: string): Promise<void> {
  const record = await prisma.record.findFirst({
    where: { id: recordId, tenantId },
    include: {
      values: { include: { field: true } },
    },
  });
  if (!record) return;

  const { title, content } = buildTitleAndContent(record.values as Parameters<typeof buildTitleAndContent>[0]);

  const existing = await prisma.searchIndex.findFirst({
    where: { tenantId, recordId },
  });
  if (existing) {
    await prisma.searchIndex.update({
      where: { id: existing.id },
      data: { title, content, moduleId: record.moduleId },
    });
  } else {
    await prisma.searchIndex.create({
      data: {
        tenantId,
        moduleId: record.moduleId,
        recordId,
        title,
        content,
      },
    });
  }
}

/**
 * Remove record from search index (on delete).
 */
export async function removeFromSearchIndex(recordId: string): Promise<void> {
  await prisma.searchIndex.deleteMany({ where: { recordId } });
}
