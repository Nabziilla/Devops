import { prisma } from "@/lib/db";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import DataTable from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Siren, Clock, BellRing, ShieldAlert } from "lucide-react";
import { cn, formatDate, severityBg, statusBg } from "@/lib/utils";
import Link from "next/link";
import IncidentsActions from "./actions-bar";

export const dynamic = "force-dynamic";

export default async function IncidentsPage() {
  const [incidents, users] = await Promise.all([
    prisma.incident.findMany({
      include: { assignee: true, assets: { include: { asset: true } } },
      orderBy: { detectedAt: "desc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const open = incidents.filter((i) => i.status !== "closed");
  const ndbApplicable = incidents.filter((i) => i.ndbApplicable);
  const ndbNotified = ndbApplicable.filter((i) => i.ndbNotifiedOaic);
  const sociReportable = incidents.filter((i) => i.sociReportable);

  // Compute regulatory clocks
  const now = Date.now();
  const overdueNDB = ndbApplicable.filter((i) => {
    if (i.ndbNotifiedOaic) return false;
    const hoursElapsed = (now - new Date(i.detectedAt).getTime()) / (1000 * 60 * 60);
    return hoursElapsed > 72; // 72h guidance for assessment + notification
  });

  return (
    <div>
      <PageHeader
        title="Incident Response"
        description="Detection, containment, and regulatory notification tracking — including the NDB scheme and SOCI Act reporting obligations."
        actions={<IncidentsActions users={users} />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Open Incidents" value={open.length} icon={Siren} tone={open.length === 0 ? "good" : "warn"} />
        <StatCard label="NDB Applicable" value={ndbApplicable.length} hint={`${ndbNotified.length} notified to OAIC`} icon={BellRing} tone={overdueNDB.length > 0 ? "bad" : "warn"} />
        <StatCard label="SOCI Reportable" value={sociReportable.length} hint="12-72h reporting window" icon={ShieldAlert} />
        <StatCard label="Overdue Notifications" value={overdueNDB.length} icon={Clock} tone={overdueNDB.length > 0 ? "bad" : "good"} />
      </div>

      <DataTable
        rowKey={(r) => r.id}
        rows={incidents}
        columns={[
          {
            key: "ref",
            header: "Ref",
            cell: (i) => (
              <Link href={`/incidents/${i.id}`} className="block">
                <div className="font-mono text-sm text-primary">{i.ref}</div>
                <div className="text-xs text-text-muted">{formatDate(i.detectedAt)}</div>
              </Link>
            ),
          },
          {
            key: "title",
            header: "Incident",
            cell: (i) => (
              <Link href={`/incidents/${i.id}`} className="block">
                <div className="font-medium truncate max-w-md">{i.title}</div>
                <div className="text-xs text-text-muted truncate max-w-md">
                  Source: {i.detectionSource}
                  {i.assets.length > 0 && ` · ${i.assets.length} asset${i.assets.length > 1 ? "s" : ""} affected`}
                  {i.recordsAffected && ` · ${i.recordsAffected.toLocaleString()} records`}
                </div>
              </Link>
            ),
          },
          {
            key: "severity",
            header: "Severity",
            cell: (i) => <span className={cn("badge", severityBg(i.severity))}>{i.severity}</span>,
          },
          {
            key: "status",
            header: "Status",
            cell: (i) => <span className={cn("badge", statusBg(i.status))}>{i.status.replace("_", " ")}</span>,
          },
          {
            key: "regulatory",
            header: "Regulatory",
            cell: (i) => (
              <div className="flex flex-wrap gap-1">
                {i.ndbApplicable && (
                  <Badge className={i.ndbNotifiedOaic ? "border-risk-low/40 text-risk-low bg-risk-low/10" : "border-risk-critical/40 text-risk-critical bg-risk-critical/10"}>
                    NDB {i.ndbNotifiedOaic ? "✓" : "!"}
                  </Badge>
                )}
                {i.sociReportable && (
                  <Badge className={i.sociReportedAt ? "border-risk-low/40 text-risk-low bg-risk-low/10" : "border-risk-high/40 text-risk-high bg-risk-high/10"}>
                    SOCI {i.sociReportedAt ? "✓" : "!"}
                  </Badge>
                )}
                {i.apraReportable && (
                  <Badge className={i.apraReportedAt ? "border-risk-low/40 text-risk-low bg-risk-low/10" : "border-risk-medium/40 text-risk-medium bg-risk-medium/10"}>
                    APRA {i.apraReportedAt ? "✓" : "!"}
                  </Badge>
                )}
                {!i.ndbApplicable && !i.sociReportable && !i.apraReportable && (
                  <span className="text-xs text-text-dim">—</span>
                )}
              </div>
            ),
          },
          {
            key: "containment",
            header: "Containment",
            cell: (i) => {
              if (!i.containedAt) {
                const hrs = ((now - new Date(i.detectedAt).getTime()) / (1000 * 60 * 60)).toFixed(1);
                return <span className="text-sm text-risk-medium">Open · {hrs}h elapsed</span>;
              }
              const mins = (new Date(i.containedAt).getTime() - new Date(i.detectedAt).getTime()) / (1000 * 60);
              return <span className="text-sm text-text-muted">MTTC {mins < 60 ? `${mins.toFixed(0)}m` : `${(mins / 60).toFixed(1)}h`}</span>;
            },
          },
          {
            key: "assignee",
            header: "Assignee",
            cell: (i) => <span className="text-sm">{i.assignee?.name ?? "Unassigned"}</span>,
          },
        ]}
      />
    </div>
  );
}
