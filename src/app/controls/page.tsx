import { prisma } from "@/lib/db";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import DataTable from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { ListChecks, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { cn, formatDate, percent, statusBg } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ControlsPage() {
  const controls = await prisma.control.findMany({
    include: { framework: true, owner: true, evidence: true, exceptions: { where: { active: true } } },
    orderBy: [{ framework: { code: "asc" } }, { code: "asc" }],
  });

  const compliant = controls.filter((c) => c.status === "compliant").length;
  const partial = controls.filter((c) => c.status === "partial").length;
  const nonCompliant = controls.filter((c) => c.status === "non_compliant").length;
  const overdue = controls.filter((c) => c.nextDue && new Date(c.nextDue) < new Date()).length;

  return (
    <div>
      <PageHeader
        title="Compliance Controls"
        description="Control library mapped to Australian and international frameworks. Each control has an owner, validation cadence, and evidence."
        actions={
          <>
            <button className="btn">Export evidence pack</button>
            <button className="btn-primary">+ Add control</button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Controls" value={controls.length} icon={ListChecks} />
        <StatCard label="Compliant" value={`${compliant} (${percent(compliant, controls.length)}%)`} icon={CheckCircle2} tone="good" />
        <StatCard label="Partial / Non-Compliant" value={partial + nonCompliant} icon={AlertCircle} tone={partial + nonCompliant > 0 ? "warn" : "good"} />
        <StatCard label="Validation Overdue" value={overdue} icon={XCircle} tone={overdue > 0 ? "bad" : "good"} />
      </div>

      <DataTable
        rowKey={(r) => r.id}
        rows={controls}
        columns={[
          {
            key: "control",
            header: "Control",
            cell: (c) => (
              <div>
                <div className="font-medium">{c.code}</div>
                <div className="text-xs text-text-muted truncate max-w-md">{c.title}</div>
              </div>
            ),
          },
          {
            key: "framework",
            header: "Framework",
            cell: (c) => (
              <div className="flex flex-col gap-1">
                <Badge className="border-primary/40 text-primary bg-primary/10 w-fit">{c.framework.code}</Badge>
                <span className="text-xs text-text-muted">{c.category}</span>
              </div>
            ),
          },
          {
            key: "status",
            header: "Status",
            cell: (c) => <span className={cn("badge", statusBg(c.status))}>{c.status.replace("_", " ")}</span>,
          },
          {
            key: "maturity",
            header: "Maturity",
            align: "center",
            cell: (c) => (
              <div className="inline-flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={cn(
                      "w-1.5 h-3 rounded-sm",
                      n <= c.maturity ? "bg-primary" : "bg-bg-hover"
                    )}
                  />
                ))}
                <span className="text-xs text-text-muted ml-1.5">{c.maturity}/5</span>
              </div>
            ),
          },
          {
            key: "owner",
            header: "Owner",
            cell: (c) => <span className="text-sm">{c.owner?.name ?? "—"}</span>,
          },
          {
            key: "evidence",
            header: "Evidence",
            align: "center",
            cell: (c) => <span className="text-sm tabular-nums">{c.evidence.length}</span>,
          },
          {
            key: "validation",
            header: "Next Validation",
            cell: (c) => {
              const overdue = c.nextDue && new Date(c.nextDue) < new Date();
              return (
                <span className={cn("text-sm", overdue ? "text-risk-critical" : "text-text-muted")}>
                  {formatDate(c.nextDue)}
                  {overdue && " · overdue"}
                </span>
              );
            },
          },
          {
            key: "exceptions",
            header: "Exceptions",
            align: "center",
            cell: (c) =>
              c.exceptions.length > 0 ? (
                <Badge className="border-risk-medium/40 text-risk-medium bg-risk-medium/10">{c.exceptions.length}</Badge>
              ) : (
                <span className="text-xs text-text-dim">—</span>
              ),
          },
        ]}
      />
    </div>
  );
}
