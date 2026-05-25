"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createPolicy(data: {
  code: string;
  title: string;
  category: string;
  version: string;
  owner: string;
  summary: string;
  effectiveDate: string;
  reviewDate: string;
  frameworkRefs: string[];
}) {
  if (!data.code.trim() || !data.title.trim()) throw new Error("Code and title are required");
  await prisma.policy.create({
    data: {
      code: data.code.trim().toUpperCase(),
      title: data.title.trim(),
      category: data.category,
      version: data.version.trim() || "1.0",
      status: "draft",
      owner: data.owner.trim(),
      effectiveDate: new Date(data.effectiveDate),
      reviewDate: new Date(data.reviewDate),
      summary: data.summary.trim(),
      frameworkRefs: data.frameworkRefs.length ? JSON.stringify(data.frameworkRefs) : null,
    },
  });
  revalidatePath("/policies");
}
