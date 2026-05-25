import { prisma } from "@/lib/db";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import DataTable from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Bug, AlertOctagon, Clock, Target } from "lucide-react";
import { cn, formatDate, severityBg, statusBg } from "@/lib/utils";
import VulnerabilitiesActions from "./actions-bar";

export const dynamic = "force-dynamic";

export default async function VulnerabilitiesPage() {
  const [vulns, assets] = await Promise.all([
    prisma.vulnerability.findMany({
      include: { asset: true },
      orderBy: [{ severity: "asc" }, { discoveredAt: "desc" }],
    }),
    prisma.asset.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const open = vulns.filter((v) => v.status === "open" || v.status === "in_progress");
  const critical = open.filter((v) => v.severity === "critical");
  const exposed = open.filter((v) => v.exposed);
  const overdue = open.filter((v) => v.slaDueAt && new Date(v.slaDueAt) < new Date());

  return (
    <div>
      <PageHeader
        title="Vulnerability Management"
        description="CVE tracking with CVSS scoring, exploitability, and remediation SLA aligned to Essential Eight and APRA CPS 234."
        actions={<VulnerabilitiesActions assets={assets} />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Open Vulnerabilities" value={open.length} icon={Bug} />
        <StatCard label="Critical" value={critical.length} icon={AlertOctagon} tone={critical.length > 0 ? "bad" : "good"} />
        <StatCard label="Internet Exposed" value={exposed.length} icon={Target} tone={exposed.length > 0 ? "bad" : "good"} />
        <StatCard label="SLA Overdue" value={overdue.length} icon={Clock} tone={overdue.length > 0 ? "bad" : "good"} />
      </div>

      <DataTable
        rowKey={(r) => r.id}
        rows={vulns}
        columns={[
          {
            key: "cve",
            header: "CVE / Finding",
            cell: (v) => (
              <div>
                <div className="font-mono text-sm">{v.cveId ?? "—"}</div>
                <div className="text-xs text-text-muted truncate max-w-md">{v.title}</div>
              </div>
            ),
          },
          {
            key: "asset",
            header: "Asset",
            cell: (v) => (
              <div>
                <div className="text-sm font-medium">{v.asset.name}</div>
                <div className="text-xs text-text-muted">{v.asset.environment}</div>
              </div>
            ),
          },
          {
            key: "severity",
            header: "Severity",
            cell: (v) => <span className={cn("badge", severityBg(v.severity))}>{v.severity}</span>,
          },
          {
            key: "cvss",
            header: "CVSS",
            align: "center",
            cell: (v) => <span className="tabular-nums text-sm">{v.cvssScore?.toFixed(1) ?? "—"}</span>,
          },
          {
            key: "flags",
            header: "Risk Flags",
            cell: (v) => (
              <div className="flex gap-1">
                {v.exploitable && <Badge className="border-risk-critical/40 text-risk-critical bg-risk-critical/10">KEV</Badge>}
                {v.exposed && <Badge className="border-risk-high/40 text-risk-high bg-risk-high/10">Exposed</Badge>}
                {!v.exploitable && !v.exposed && <span className="text-xs text-text-dim">—</span>}
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (v) => <span className={cn("badge", statusBg(v.status))}>{v.status.replace("_", " ")}</span>,
          },
          {
            key: "discovered",
            header: "Discovered",
            cell: (v) => <span className="text-sm text-text-muted">{formatDate(v.discoveredAt)}</span>,
          },
          {
            key: "sla",
            header: "SLA Due",
            cell: (v) => {
              const overdue = v.slaDueAt && new Date(v.slaDueAt) < new Date() && v.status === "open";
              return (
                <span className={cn("text-sm", overdue ? "text-risk-critical font-medium" : "text-text-muted")}>
                  {formatDate(v.slaDueAt)}
                </span>
              );
            },
          },
          {
            key: "owner",
            header: "Owner",
            cell: (v) => <span className="text-sm">{v.remediationOwner ?? "—"}</span>,
          },
        ]}
      />
    </div>
  );
}
