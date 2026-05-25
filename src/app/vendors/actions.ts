"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createVendor(data: {
  name: string;
  category: string;
  dataAccessLevel: string;
  riskScore: number;
  attestations: string[];
  contractExpires?: string | null;
  notes?: string | null;
}) {
  if (!data.name.trim()) throw new Error("Name is required");
  const now = new Date();
  const oneYear = new Date(now);
  oneYear.setFullYear(now.getFullYear() + 1);
  await prisma.vendor.create({
    data: {
      name: data.name.trim(),
      category: data.category,
      dataAccessLevel: data.dataAccessLevel,
      riskScore: Math.max(0, Math.min(100, data.riskScore)),
      assessmentStatus: "not_started",
      nextAssessmentDue: oneYear,
      contractExpires: data.contractExpires ? new Date(data.contractExpires) : null,
      attestations: data.attestations.length ? JSON.stringify(data.attestations) : null,
      notes: data.notes?.trim() || null,
    },
  });
  revalidatePath("/vendors");
}

export async function sendDDQ(vendorIds: string[]) {
  if (vendorIds.length === 0) {
    const due = await prisma.vendor.findMany({
      where: {
        active: true,
        OR: [
          { assessmentStatus: "expired" },
          { assessmentStatus: "not_started" },
        ],
      },
      select: { id: true },
    });
    vendorIds = due.map((v) => v.id);
  }
  if (vendorIds.length === 0) return { count: 0 };
  await prisma.vendor.updateMany({
    where: { id: { in: vendorIds } },
    data: { assessmentStatus: "in_progress" },
  });
  revalidatePath("/vendors");
  return { count: vendorIds.length };
}
