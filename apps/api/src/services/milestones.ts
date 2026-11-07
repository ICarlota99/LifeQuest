import { and, eq } from "drizzle-orm";
import { milestones, newId } from "@lifequest/db";
import { db } from "../db.js";
import { HttpError } from "../lib/errors.js";

export async function listMilestones(
  userId: string,
  subjectType?: string,
  subjectId?: string,
) {
  if (subjectType && subjectId) {
    return db.query.milestones.findMany({
      where: and(
        eq(milestones.userId, userId),
        eq(milestones.subjectType, subjectType),
        eq(milestones.subjectId, subjectId),
      ),
    });
  }
  return db.query.milestones.findMany({
    where: eq(milestones.userId, userId),
  });
}

export async function createMilestone(
  userId: string,
  input: {
    subjectType: string;
    subjectId: string;
    title: string;
    description?: string;
    milestoneType?: string;
    required?: number;
  },
) {
  const [row] = await db
    .insert(milestones)
    .values({
      id: newId("ms"),
      userId,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      title: input.title,
      description: input.description ?? "",
      milestoneType: input.milestoneType ?? "boolean",
      required: input.required ?? 1,
      status: "pending",
    })
    .returning();
  return row!;
}

export async function completeMilestone(userId: string, milestoneId: string) {
  const existing = await db.query.milestones.findFirst({
    where: and(eq(milestones.id, milestoneId), eq(milestones.userId, userId)),
  });
  if (!existing) throw new HttpError(404, "Milestone not found");

  const [row] = await db
    .update(milestones)
    .set({
      status: "completed",
      progress: existing.required,
      updatedAt: new Date(),
    })
    .where(eq(milestones.id, milestoneId))
    .returning();
  return row!;
}

export async function deleteMilestone(userId: string, milestoneId: string) {
  const existing = await db.query.milestones.findFirst({
    where: and(eq(milestones.id, milestoneId), eq(milestones.userId, userId)),
  });
  if (!existing) throw new HttpError(404, "Milestone not found");
  await db.delete(milestones).where(eq(milestones.id, milestoneId));
}
