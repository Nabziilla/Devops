import { prisma } from "@/lib/db";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import DataTable from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldQuestion, AlertTriangle, ClipboardCheck } from "lucide-react";
import { cn, formatDate, safeJsonParse, statusBg } from "@/lib/utils";
import VendorsActions from "./actions-bar";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({ orderBy: [{ riskScore: "desc" }, { name: "asc" }] });

  const active = vendors.filter((v) => v.active);
  const high = active.filter((v) => v.riskScore >= 70);
  const expired = active.filter((v) => v.assessmentStatus === "expired" || (v.nextAssessmentDue && new Date(v.nextAssessmentDue) < new Date()));
  const piiAccess = active.filter((v) => ["pii", "restricted"].includes(v.dataAccessLevel));

  return (
    <div>
      <PageHeader
        title="Vendor Risk Management"
        description="Third-party risk register — supply chain due diligence required by SOCI and APRA CPS 234. Tracks attestations, data access scope, and assessment cadence."
        actions={<VendorsActions />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Active Vendors" value={active.length} icon={Building2} />
        <StatCard label="High Risk (≥70)" value={high.length} icon={AlertTriangle} tone={high.length > 0 ? "bad" : "good"} />
        <StatCard label="PII / Restricted Access" value={piiAccess.length} icon={ShieldQuestion} />
        <StatCard label="Assessment Overdue" value={expired.length} icon={ClipboardCheck} tone={expired.length > 0 ? "bad" : "good"} />
      </div>

      <DataTable
        rowKey={(r) => r.id}
        rows={vendors}
        columns={[
          {
            key: "name",
            header: "Vendor",
            cell: (v) => (
              <div>
                <div className="font-medium">{v.name}</div>
                <div className="text-xs text-text-muted">{v.category}</div>
              </div>
            ),
          },
          {
            key: "access",
            header: "Data Access",
            cell: (v) => {
              const colors: Record<string, string> = {
                none: "border-border text-text-muted bg-bg-hover",
                internal: "border-primary/40 text-primary bg-primary/10",
                pii: "border-risk-medium/40 text-risk-medium bg-risk-medium/10",
                restricted: "border-risk-critical/40 text-risk-critical bg-risk-critical/10",
              };
              return <span className={cn("badge", colors[v.dataAccessLevel] ?? colors.none)}>{v.dataAccessLevel}</span>;
            },
          },
          {
            key: "risk",
            header: "Risk Score",
            align: "center",
            cell: (v) => (
              <div className="flex items-center gap-2 justify-center">
                <div className="w-20 h-1.5 bg-bg-hover rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full",
                      v.riskScore >= 70 ? "bg-risk-critical" : v.riskScore >= 40 ? "bg-risk-medium" : "bg-risk-low"
                    )}
                    style={{ width: `${v.riskScore}%` }}
                  />
                </div>
                <span className="text-sm tabular-nums">{v.riskScore}</span>
              </div>
            ),
          },
          {
            key: "attestations",
            header: "Attestations",
            cell: (v) => {
              const att = safeJsonParse<string[]>(v.attestations, []);
              return (
                <div className="flex flex-wrap gap-1">
                  {att.map((a) => (
                    <Badge key={a} className="border-primary/40 text-primary bg-primary/10">{a}</Badge>
                  ))}
                  {att.length === 0 && <span className="text-xs text-text-dim">—</span>}
                </div>
              );
            },
          },
          {
            key: "status",
            header: "Assessment",
            cell: (v) => <span className={cn("badge", statusBg(v.assessmentStatus))}>{v.assessmentStatus.replace("_", " ")}</span>,
          },
          { key: "last", header: "Last Assessed", cell: (v) => <span className="text-sm text-text-muted">{formatDate(v.lastAssessedAt)}</span> },
          {
            key: "due",
            header: "Next Due",
            cell: (v) => {
              const overdue = v.nextAssessmentDue && new Date(v.nextAssessmentDue) < new Date();
              return (
                <span className={cn("text-sm", overdue ? "text-risk-critical" : "text-text-muted")}>
                  {formatDate(v.nextAssessmentDue)}
                </span>
              );
            },
          },
          { key: "incidents", header: "Incidents", align: "center", cell: (v) => <span className="text-sm tabular-nums">{v.incidents}</span> },
        ]}
      />
    </div>
  );
}
