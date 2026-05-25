"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createControl(data: {
  code: string;
  title: string;
  description: string;
  category: string;
  frameworkId: string;
  status: string;
  maturity: number;
  validationFreq: string;
  ownerId?: string | null;
}) {
  if (!data.code.trim() || !data.title.trim()) throw new Error("Code and title are required");
  const nextDue = new Date();
  const months = data.validationFreq === "monthly" ? 1 : data.validationFreq === "quarterly" ? 3 : 12;
  nextDue.setMonth(nextDue.getMonth() + months);
  await prisma.control.create({
    data: {
      code: data.code.trim().toUpperCase(),
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      frameworkId: data.frameworkId,
      status: data.status,
      maturity: Math.max(0, Math.min(5, data.maturity)),
      validationFreq: data.validationFreq,
      nextDue,
      ownerId: data.ownerId || null,
    },
  });
  revalidatePath("/controls");
  revalidatePath("/");
}
