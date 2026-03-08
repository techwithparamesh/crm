/**
 * Comments on records — collaboration and @mentions.
 */

import { prisma } from "../../prisma/client.js";

export interface CreateCommentInput {
  recordId: string;
  message: string;
}

export async function createComment(
  tenantId: string,
  userId: string,
  input: CreateCommentInput
) {
  const record = await prisma.record.findFirst({
    where: { id: input.recordId, tenantId },
  });
  if (!record) throw new Error("Record not found");

  return prisma.comment.create({
    data: {
      tenantId,
      recordId: input.recordId,
      userId,
      message: input.message.trim(),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function listCommentsByRecordId(
  tenantId: string,
  recordId: string,
  limit = 100
) {
  const record = await prisma.record.findFirst({
    where: { id: recordId, tenantId },
  });
  if (!record) throw new Error("Record not found");

  return prisma.comment.findMany({
    where: { tenantId, recordId },
    orderBy: { createdAt: "asc" },
    take: Math.min(limit, 100),
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function deleteComment(
  tenantId: string,
  commentId: string,
  userId: string
) {
  const comment = await prisma.comment.findFirst({
    where: { id: commentId, tenantId },
  });
  if (!comment) throw new Error("Comment not found");
  if (comment.userId !== userId) throw new Error("You can only delete your own comments");

  await prisma.comment.delete({ where: { id: commentId } });
}
