"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createChange(data: {
  title: string;
  description: string;
  riskLevel: string;
  emergency: boolean;
  assetId?: string | null;
  approverId?: string | null;
  scheduledFor?: string | null;
}) {
  if (!data.title.trim()) throw new Error("Title is required");
  const count = await prisma.change.count();
  const year = new Date().getFullYear();
  await prisma.change.create({
    data: {
      ref: `CHG-${year}-${String(count + 1).padStart(4, "0")}`,
      title: data.title.trim(),
      description: data.description.trim(),
      riskLevel: data.riskLevel,
      emergency: data.emergency,
      status: "pending_approval",
      assetId: data.assetId || null,
      approverId: data.approverId || null,
      scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
    },
  });
  revalidatePath("/changes");
}
