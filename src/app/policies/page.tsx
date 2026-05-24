import { prisma } from "@/lib/db";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import DataTable from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { ScrollText, CalendarClock, FileText, CheckCircle2 } from "lucide-react";
import { cn, formatDate, safeJsonParse, statusBg } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const policies = await prisma.policy.findMany({ orderBy: { code: "asc" } });

  const published = policies.filter((p) => p.status === "published");
  const underReview = policies.filter((p) => p.status === "under_review");
  const overdue = policies.filter((p) => new Date(p.reviewDate) < new Date() && p.status !== "retired");

  return (
    <div>
      <PageHeader
        title="Policies & Standards"
        description="Governance documents underpinning the control library. Each policy has an owner, version, and review cadence."
        actions={
          <>
            <button className="btn">Open policy library</button>
            <button className="btn-primary">+ New policy</button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Policies" value={policies.length} icon={ScrollText} />
        <StatCard label="Published" value={published.length} icon={CheckCircle2} tone="good" />
        <StatCard label="Under Review" value={underReview.length} icon={FileText} tone={underReview.length > 0 ? "warn" : "good"} />
        <StatCard label="Review Overdue" value={overdue.length} icon={CalendarClock} tone={overdue.length > 0 ? "bad" : "good"} />
      </div>

      <DataTable
        rowKey={(r) => r.id}
        rows={policies}
        columns={[
          {
            key: "code",
            header: "Policy",
            cell: (p) => (
              <div>
                <div className="font-mono text-sm">{p.code}</div>
                <div className="text-xs text-text-muted">{p.title}</div>
              </div>
            ),
          },
          { key: "category", header: "Category", cell: (p) => <Badge>{p.category}</Badge> },
          { key: "version", header: "Version", cell: (p) => <span className="font-mono text-sm">{p.version}</span> },
          { key: "status", header: "Status", cell: (p) => <span className={cn("badge", statusBg(p.status))}>{p.status.replace("_", " ")}</span> },
          { key: "owner", header: "Owner", cell: (p) => <span className="text-sm">{p.owner}</span> },
          {
            key: "frameworks",
            header: "Frameworks",
            cell: (p) => {
              const f = safeJsonParse<string[]>(p.frameworkRefs, []);
              return (
                <div className="flex flex-wrap gap-1">
                  {f.map((x) => (
                    <Badge key={x} className="border-primary/40 text-primary bg-primary/10">{x}</Badge>
                  ))}
                </div>
              );
            },
          },
          { key: "effective", header: "Effective", cell: (p) => <span className="text-sm text-text-muted">{formatDate(p.effectiveDate)}</span> },
          {
            key: "review",
            header: "Next Review",
            cell: (p) => {
              const overdue = new Date(p.reviewDate) < new Date() && p.status !== "retired";
              return (
                <span className={cn("text-sm", overdue ? "text-risk-critical font-medium" : "text-text-muted")}>
                  {formatDate(p.reviewDate)}
                </span>
              );
            },
          },
        ]}
      />
    </div>
  );
}
