"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function scheduleReview(data: {
  scope: string;
  reviewerId: string;
  scheduledFor: string;
}) {
  if (!data.scope.trim()) throw new Error("Scope is required");
  if (!data.reviewerId) throw new Error("Reviewer is required");
  await prisma.accessReview.create({
    data: {
      scope: data.scope.trim(),
      reviewerId: data.reviewerId,
      scheduledFor: new Date(data.scheduledFor),
      status: "pending",
    },
  });
  revalidatePath("/iam");
}
