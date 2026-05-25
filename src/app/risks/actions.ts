"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createRisk(data: {
  title: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  treatment: string;
  mitigationPlan?: string;
  ownerId?: string | null;
  dueDate?: string | null;
  frameworkRefs: string[];
}) {
  if (!data.title.trim()) throw new Error("Title is required");
  const inherentScore = data.likelihood * data.impact;
  const residualScore = data.treatment === "mitigate"
    ? Math.max(1, Math.round(inherentScore * 0.5))
    : data.treatment === "transfer"
    ? Math.max(1, Math.round(inherentScore * 0.6))
    : data.treatment === "avoid"
    ? Math.max(1, Math.round(inherentScore * 0.3))
    : inherentScore;

  await prisma.risk.create({
    data: {
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      likelihood: data.likelihood,
      impact: data.impact,
      inherentScore,
      residualScore,
      status: "open",
      treatment: data.treatment,
      mitigationPlan: data.mitigationPlan?.trim() || null,
      ownerId: data.ownerId || null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      frameworkRefs: data.frameworkRefs.length ? JSON.stringify(data.frameworkRefs) : null,
    },
  });
  revalidatePath("/risks");
  revalidatePath("/");
}
