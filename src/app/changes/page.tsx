import { prisma } from "@/lib/db";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import DataTable from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { GitPullRequest, AlertTriangle, RotateCcw, CheckCircle } from "lucide-react";
import { cn, formatDate, severityBg, statusBg } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ChangesPage() {
  const changes = await prisma.change.findMany({
    include: { approver: true, asset: true },
    orderBy: { createdAt: "desc" },
  });

  const pending = changes.filter((c) => c.status === "pending_approval");
  const emergency = changes.filter((c) => c.emergency);
  const rollbacks = changes.filter((c) => c.status === "rolled_back");
  const deployed = changes.filter((c) => c.status === "deployed");

  return (
    <div>
      <PageHeader
        title="Change Management"
        description="All production changes with approval chain, risk scoring, and rollback history. Required evidence for APRA CPS 234 and SOC 2 CC8.1."
        actions={
          <>
            <button className="btn">Export change log</button>
            <button className="btn-primary">+ Raise change</button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Pending Approval" value={pending.length} icon={GitPullRequest} tone={pending.length > 0 ? "warn" : "good"} />
        <StatCard label="Deployed (30d)" value={deployed.length} icon={CheckCircle} />
        <StatCard label="Emergency Changes" value={emergency.length} icon={AlertTriangle} tone={emergency.length > 0 ? "warn" : "good"} />
        <StatCard label="Rollbacks" value={rollbacks.length} icon={RotateCcw} tone={rollbacks.length > 0 ? "warn" : "good"} />
      </div>

      <DataTable
        rowKey={(r) => r.id}
        rows={changes}
        columns={[
          {
            key: "ref",
            header: "Ref",
            cell: (c) => (
              <div>
                <div className="font-mono text-sm text-primary">{c.ref}</div>
                <div className="text-xs text-text-muted">{formatDate(c.createdAt)}</div>
              </div>
            ),
          },
          {
            key: "title",
            header: "Change",
            cell: (c) => (
              <div>
                <div className="font-medium truncate max-w-md">{c.title}</div>
                {c.asset && <div className="text-xs text-text-muted">{c.asset.name}</div>}
              </div>
            ),
          },
          {
            key: "risk",
            header: "Risk",
            cell: (c) => <span className={cn("badge", severityBg(c.riskLevel === "emergency" ? "critical" : c.riskLevel))}>{c.riskLevel}</span>,
          },
          {
            key: "status",
            header: "Status",
            cell: (c) => <span className={cn("badge", statusBg(c.status))}>{c.status.replace("_", " ")}</span>,
          },
          { key: "approver", header: "Approver", cell: (c) => <span className="text-sm">{c.approver?.name ?? "—"}</span> },
          { key: "sched", header: "Scheduled", cell: (c) => <span className="text-sm text-text-muted">{formatDate(c.scheduledFor)}</span> },
          { key: "deployed", header: "Deployed", cell: (c) => <span className="text-sm text-text-muted">{formatDate(c.deployedAt)}</span> },
          {
            key: "emergency",
            header: "Type",
            align: "center",
            cell: (c) =>
              c.emergency ? (
                <Badge className="border-risk-critical/40 text-risk-critical bg-risk-critical/10">Emergency</Badge>
              ) : (
                <Badge>Standard</Badge>
              ),
          },
        ]}
      />
    </div>
  );
}
