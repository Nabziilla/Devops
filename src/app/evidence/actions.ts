"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createEvidence(data: {
  title: string;
  type: string;
  source: string;
  collectedBy: string;
  controlId?: string | null;
  reference?: string | null;
  retentionDays: number;
  immutable: boolean;
  auditRef?: string | null;
}) {
  if (!data.title.trim()) throw new Error("Title is required");
  const collectedAt = new Date();
  const retentionUntil = new Date(collectedAt);
  retentionUntil.setDate(retentionUntil.getDate() + Math.max(1, data.retentionDays));
  await prisma.evidence.create({
    data: {
      title: data.title.trim(),
      type: data.type,
      source: data.source,
      collectedBy: data.collectedBy.trim() || "console-user",
      controlId: data.controlId || null,
      reference: data.reference?.trim() || null,
      collectedAt,
      retentionUntil,
      immutable: data.immutable,
      auditRef: data.auditRef?.trim() || null,
    },
  });
  revalidatePath("/evidence");
}
