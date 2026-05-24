import { prisma } from "@/lib/db";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import DataTable from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Server, Lock, Globe, Database, ShieldAlert } from "lucide-react";
import { cn, formatDate, percent, severityBg } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const assets = await prisma.asset.findMany({
    include: { owner: true },
    orderBy: [{ criticality: "asc" }, { name: "asc" }],
  });

  const totals = {
    total: assets.length,
    critical: assets.filter((a) => a.criticality === "critical").length,
    pii: assets.filter((a) => a.containsPII).length,
    publicExposure: assets.filter((a) => a.publicExposure).length,
    encryptionAtRest: assets.filter((a) => a.encryptionAtRest).length,
    backupCoverage: percent(assets.filter((a) => a.backupConfigured).length, assets.length || 1),
  };

  return (
    <div>
      <PageHeader
        title="Asset Inventory"
        description="Cloud, on-prem and SaaS assets — classified by data sensitivity, criticality and regulatory scope."
        actions={
          <>
            <button className="btn">Export CSV</button>
            <button className="btn-primary">+ Register asset</button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total Assets" value={totals.total} icon={Server} />
        <StatCard label="Critical" value={totals.critical} icon={ShieldAlert} tone={totals.critical > 0 ? "warn" : "good"} />
        <StatCard label="Contains PII" value={totals.pii} icon={Database} />
        <StatCard label="Public Exposure" value={totals.publicExposure} icon={Globe} tone={totals.publicExposure > 0 ? "bad" : "good"} />
        <StatCard label="Backup Coverage" value={`${totals.backupCoverage}%`} icon={Lock} tone={totals.backupCoverage >= 90 ? "good" : "warn"} />
      </div>

      <DataTable
        rowKey={(r) => r.id}
        rows={assets}
        columns={[
          {
            key: "name",
            header: "Asset",
            cell: (a) => (
              <Link href={`/assets/${a.id}`} className="block">
                <div className="font-medium text-text">{a.name}</div>
                <div className="text-xs text-text-muted">
                  {a.type} · {a.cloudProvider ?? "on-prem"}
                  {a.region && ` · ${a.region}`} · {a.environment}
                </div>
              </Link>
            ),
          },
          {
            key: "criticality",
            header: "Criticality",
            cell: (a) => <span className={cn("badge", severityBg(a.criticality))}>{a.criticality}</span>,
          },
          {
            key: "classification",
            header: "Classification",
            cell: (a) => <Badge>{a.dataClassification}</Badge>,
          },
          {
            key: "regulatory",
            header: "Regulatory Scope",
            cell: (a) => (
              <div className="flex flex-wrap gap-1">
                {a.containsPII && <Badge className="border-primary/40 text-primary bg-primary/10">PII</Badge>}
                {a.containsHealthData && <Badge className="border-risk-high/40 text-risk-high bg-risk-high/10">Health</Badge>}
                {a.containsCardData && <Badge className="border-risk-critical/40 text-risk-critical bg-risk-critical/10">PCI</Badge>}
                {a.soci && <Badge className="border-risk-medium/40 text-risk-medium bg-risk-medium/10">SOCI</Badge>}
                {a.cdr && <Badge className="border-risk-low/40 text-risk-low bg-risk-low/10">CDR</Badge>}
                {!a.containsPII && !a.containsHealthData && !a.containsCardData && !a.soci && !a.cdr && (
                  <span className="text-xs text-text-dim">—</span>
                )}
              </div>
            ),
          },
          {
            key: "controls",
            header: "Security Controls",
            cell: (a) => (
              <div className="flex flex-wrap gap-1 text-[10px]">
                <span className={cn("badge", a.encryptionAtRest ? "border-risk-low/40 text-risk-low bg-risk-low/10" : "border-risk-critical/40 text-risk-critical bg-risk-critical/10")}>
                  {a.encryptionAtRest ? "Enc@Rest" : "No Enc@Rest"}
                </span>
                <span className={cn("badge", a.encryptionInTransit ? "border-risk-low/40 text-risk-low bg-risk-low/10" : "border-risk-critical/40 text-risk-critical bg-risk-critical/10")}>
                  {a.encryptionInTransit ? "TLS" : "No TLS"}
                </span>
                <span className={cn("badge", a.mfaEnforced ? "border-risk-low/40 text-risk-low bg-risk-low/10" : "border-risk-medium/40 text-risk-medium bg-risk-medium/10")}>
                  {a.mfaEnforced ? "MFA" : "No MFA"}
                </span>
                <span className={cn("badge", a.backupConfigured ? "border-risk-low/40 text-risk-low bg-risk-low/10" : "border-risk-critical/40 text-risk-critical bg-risk-critical/10")}>
                  {a.backupConfigured ? "Backup" : "No Backup"}
                </span>
                <span className={cn("badge", a.edrInstalled ? "border-risk-low/40 text-risk-low bg-risk-low/10" : "border-risk-medium/40 text-risk-medium bg-risk-medium/10")}>
                  {a.edrInstalled ? "EDR" : "No EDR"}
                </span>
              </div>
            ),
          },
          {
            key: "patch",
            header: "Patch",
            cell: (a) => <span className={cn("badge", severityBg(a.patchStatus === "critical" ? "critical" : a.patchStatus === "lagging" ? "medium" : a.patchStatus === "current" ? "low" : "info"))}>{a.patchStatus}</span>,
          },
          {
            key: "owner",
            header: "Owner",
            cell: (a) => <span className="text-sm">{a.owner?.name ?? "—"}</span>,
          },
          {
            key: "patched",
            header: "Last Patched",
            cell: (a) => <span className="text-sm text-text-muted">{formatDate(a.lastPatchedAt)}</span>,
          },
        ]}
      />
    </div>
  );
}
