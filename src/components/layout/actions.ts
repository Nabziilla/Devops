"use server";

import { prisma } from "@/lib/db";

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  tone: "critical" | "warn" | "info";
  href: string;
}

export async function getNotifications(): Promise<NotificationItem[]> {
  const now = new Date();
  const items: NotificationItem[] = [];

  const overdueNDB = await prisma.incident.findMany({
    where: { ndbApplicable: true, ndbNotifiedOaic: false },
    orderBy: { detectedAt: "asc" },
  });
  for (const i of overdueNDB) {
    const hrs = (now.getTime() - new Date(i.detectedAt).getTime()) / (1000 * 60 * 60);
    if (hrs > 72) {
      items.push({
        id: `ndb-${i.id}`,
        title: `NDB notification overdue · ${i.ref}`,
        detail: `${Math.round(hrs)}h since detection. OAIC notification not yet recorded.`,
        tone: "critical",
        href: `/incidents/${i.id}`,
      });
    }
  }

  const overdueVulns = await prisma.vulnerability.findMany({
    where: { status: "open", slaDueAt: { lt: now }, severity: { in: ["critical", "high"] } },
    include: { asset: true },
    take: 10,
  });
  for (const v of overdueVulns) {
    items.push({
      id: `vuln-${v.id}`,
      title: `${v.severity.toUpperCase()} vuln overdue · ${v.cveId ?? v.title.slice(0, 30)}`,
      detail: `${v.asset.name} — SLA breached.`,
      tone: v.severity === "critical" ? "critical" : "warn",
      href: "/vulnerabilities",
    });
  }

  const overdueReviews = await prisma.accessReview.findMany({
    where: { status: { in: ["pending", "in_progress"] }, scheduledFor: { lt: now } },
    include: { reviewer: true },
    take: 5,
  });
  for (const r of overdueReviews) {
    items.push({
      id: `review-${r.id}`,
      title: `Access review overdue · ${r.scope}`,
      detail: `Reviewer: ${r.reviewer.name}.`,
      tone: "warn",
      href: "/iam",
    });
  }

  const overdueControls = await prisma.control.findMany({
    where: { nextDue: { lt: now }, status: { not: "not_applicable" } },
    take: 5,
    orderBy: { nextDue: "asc" },
  });
  for (const c of overdueControls) {
    items.push({
      id: `ctrl-${c.id}`,
      title: `Control validation overdue · ${c.code}`,
      detail: c.title,
      tone: "info",
      href: "/controls",
    });
  }

  return items;
}
