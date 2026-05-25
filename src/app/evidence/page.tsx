import { prisma } from "@/lib/db";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import DataTable from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Archive, Lock, Calendar, ListChecks } from "lucide-react";
import { formatDate } from "@/lib/utils";
import EvidenceActions from "./actions-bar";

export const dynamic = "force-dynamic";

export default async function EvidencePage() {
  const [evidence, controls] = await Promise.all([
    prisma.evidence.findMany({
      include: { control: { include: { framework: true } } },
      orderBy: { collectedAt: "desc" },
    }),
    prisma.control.findMany({
      orderBy: [{ framework: { code: "asc" } }, { code: "asc" }],
      select: { id: true, code: true, framework: { select: { code: true } } },
    }),
  ]);

  const total = evidence.length;
  const immutable = evidence.filter((e) => e.immutable).length;
  const expiringSoon = evidence.filter((e) => {
    const days = (new Date(e.retentionUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  }).length;
  const linked = evidence.filter((e) => !!e.controlId).length;

  return (
    <div>
      <PageHeader
        title="Evidence Repository"
        description="Immutable, retention-aware evidence linked to controls — ready for audit exports across Privacy Act, APRA CPS 234, ISO 27001 and SOC 2."
        actions={<EvidenceActions controls={controls} evidence={evidence} />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Evidence Items" value={total} icon={Archive} />
        <StatCard label="Immutable" value={immutable} icon={Lock} tone="good" />
        <StatCard label="Linked to Controls" value={linked} icon={ListChecks} />
        <StatCard label="Expiring (≤30d)" value={expiringSoon} icon={Calendar} tone={expiringSoon > 0 ? "warn" : "good"} />
      </div>

      <DataTable
        rowKey={(r) => r.id}
        rows={evidence}
        columns={[
          {
            key: "title",
            header: "Evidence",
            cell: (e) => (
              <div>
                <div className="font-medium truncate max-w-md">{e.title}</div>
                <div className="text-xs text-text-muted">{e.source} · collected by {e.collectedBy}</div>
              </div>
            ),
          },
          { key: "type", header: "Type", cell: (e) => <Badge>{e.type.replace("_", " ")}</Badge> },
          {
            key: "control",
            header: "Control",
            cell: (e) =>
              e.control ? (
                <div>
                  <div className="text-sm">{e.control.code}</div>
                  <div className="text-xs text-text-muted">{e.control.framework.code}</div>
                </div>
              ) : (
                <span className="text-xs text-text-dim">—</span>
              ),
          },
          { key: "collected", header: "Collected", cell: (e) => <span className="text-sm text-text-muted">{formatDate(e.collectedAt)}</span> },
          { key: "retention", header: "Retention until", cell: (e) => <span className="text-sm text-text-muted">{formatDate(e.retentionUntil)}</span> },
          {
            key: "immutable",
            header: "Immutable",
            align: "center",
            cell: (e) =>
              e.immutable ? (
                <Badge className="border-risk-low/40 text-risk-low bg-risk-low/10">Locked</Badge>
              ) : (
                <Badge className="border-risk-medium/40 text-risk-medium bg-risk-medium/10">Mutable</Badge>
              ),
          },
          { key: "audit", header: "Audit Ref", cell: (e) => <span className="text-xs text-text-muted font-mono">{e.auditRef ?? "—"}</span> },
        ]}
      />
    </div>
  );
}
