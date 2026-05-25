"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

interface SbomComponent {
  name: string;
  version?: string;
  cve?: string;
  severity?: string;
  cvssScore?: number;
  description?: string;
}

export async function importSbom(data: {
  assetId: string;
  components: SbomComponent[];
}) {
  if (!data.assetId) throw new Error("Asset is required");
  if (data.components.length === 0) return { created: 0 };

  const slaMap: Record<string, number> = { critical: 7, high: 14, medium: 30, low: 90 };
  const now = new Date();
  let created = 0;
  for (const c of data.components) {
    const sev = (c.severity ?? "medium").toLowerCase();
    const slaDays = slaMap[sev] ?? 30;
    const slaDueAt = new Date(now);
    slaDueAt.setDate(now.getDate() + slaDays);
    await prisma.vulnerability.create({
      data: {
        cveId: c.cve || null,
        title: c.name + (c.version ? ` ${c.version}` : ""),
        description: c.description || `Imported from SBOM: ${c.name}${c.version ? `@${c.version}` : ""}`,
        severity: ["critical", "high", "medium", "low"].includes(sev) ? sev : "medium",
        cvssScore: c.cvssScore ?? null,
        assetId: data.assetId,
        status: "open",
        exploitable: false,
        exposed: false,
        discoveredAt: now,
        slaDueAt,
      },
    });
    created += 1;
  }
  revalidatePath("/vulnerabilities");
  return { created };
}

export async function runScan(assetId?: string) {
  // Simulated scan — refresh discovery dates on open vulnerabilities.
  const where = assetId ? { assetId, status: "open" } : { status: "open" };
  const result = await prisma.vulnerability.updateMany({
    where,
    data: { discoveredAt: new Date() },
  });
  revalidatePath("/vulnerabilities");
  return { scanned: result.count };
}
