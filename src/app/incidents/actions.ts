"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

function nextRef(prefix: string, count: number) {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function createIncident(data: {
  title: string;
  description: string;
  severity: string;
  detectionSource: string;
  ndbApplicable: boolean;
  sociReportable: boolean;
  apraReportable: boolean;
  piiAffected: boolean;
  recordsAffected?: number | null;
  assigneeId?: string | null;
}) {
  if (!data.title.trim()) throw new Error("Title is required");
  const count = await prisma.incident.count();
  const incident = await prisma.incident.create({
    data: {
      ref: nextRef("INC", count),
      title: data.title.trim(),
      description: data.description.trim(),
      severity: data.severity,
      status: "open",
      detectionSource: data.detectionSource,
      detectedAt: new Date(),
      ndbApplicable: data.ndbApplicable,
      sociReportable: data.sociReportable,
      apraReportable: data.apraReportable,
      piiAffected: data.piiAffected,
      recordsAffected: data.recordsAffected ?? null,
      assigneeId: data.assigneeId || null,
    },
  });
  await prisma.incidentEvent.create({
    data: {
      incidentId: incident.id,
      eventType: "detected",
      description: `Incident logged via console. Source: ${data.detectionSource}.`,
      actor: "console-user",
    },
  });
  revalidatePath("/incidents");
  revalidatePath("/");
  return { id: incident.id, ref: incident.ref };
}
