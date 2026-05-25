import { prisma } from "@/lib/db";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import DataTable from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, Eye, Shield } from "lucide-react";
import { cn, formatDate, riskScoreLabel, statusBg } from "@/lib/utils";
import RisksActions from "./actions-bar";

export const dynamic = "force-dynamic";

export default async function RisksPage() {
  const [risks, users] = await Promise.all([
    prisma.risk.findMany({
      include: { owner: true },
      orderBy: { residualScore: "desc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const open = risks.filter((r) => r.status !== "closed");
  const critical = open.filter((r) => r.residualScore >= 20).length;
  const high = open.filter((r) => r.residualScore >= 12 && r.residualScore < 20).length;
  const accepted = risks.filter((r) => r.status === "accepted").length;

  // 5x5 heatmap
  const heatmap: number[][] = Array.from({ length: 5 }, () => Array(5).fill(0));
  open.forEach((r) => {
    heatmap[5 - r.impact]?.[r.likelihood - 1] != null && heatmap[5 - r.impact][r.likelihood - 1]++;
  });

  return (
    <div>
      <PageHeader
        title="Risk Register"
        description="Inherent and residual risk scoring across cyber, privacy, operational and supply chain categories."
        actions={<RisksActions users={users} risks={risks} />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Open Risks" value={open.length} icon={AlertTriangle} />
        <StatCard label="Critical (20+)" value={critical} icon={AlertTriangle} tone={critical > 0 ? "bad" : "good"} />
        <StatCard label="High (12-19)" value={high} icon={Eye} tone={high > 0 ? "warn" : "good"} />
        <StatCard label="Risks Accepted" value={accepted} icon={Shield} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 lg:col-span-1">
          <div className="text-sm font-medium mb-3">Risk Heatmap (residual)</div>
          <div className="flex">
            <div className="flex flex-col justify-around mr-2 text-[10px] text-text-dim font-medium uppercase pr-1">
              <span>5</span><span>4</span><span>3</span><span>2</span><span>1</span>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-5 gap-1">
                {heatmap.flatMap((row, ri) =>
                  row.map((count, ci) => {
                    const impact = 5 - ri;
                    const likelihood = ci + 1;
                    const score = impact * likelihood;
                    const { color } = riskScoreLabel(score);
                    const bg =
                      score >= 20 ? "bg-risk-critical/20 border-risk-critical/50" :
                      score >= 12 ? "bg-risk-high/20 border-risk-high/50" :
                      score >= 6 ? "bg-risk-medium/20 border-risk-medium/50" :
                      "bg-risk-low/20 border-risk-low/50";
                    return (
                      <div
                        key={`${ri}-${ci}`}
                        className={cn("aspect-square rounded border flex items-center justify-center", bg)}
                      >
                        <span className={cn("text-sm font-semibold tabular-nums", color)}>
                          {count > 0 ? count : ""}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex justify-around mt-1.5 text-[10px] text-text-dim font-medium uppercase">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
              </div>
              <div className="text-[10px] text-text-dim text-center mt-1">Likelihood →</div>
            </div>
          </div>
          <div className="text-[10px] text-text-dim mt-2 text-center">↑ Impact</div>
        </div>

        <div className="lg:col-span-2">
          <DataTable
            rowKey={(r) => r.id}
            rows={risks.slice(0, 10)}
            columns={[
              {
                key: "title",
                header: "Risk",
                cell: (r) => (
                  <div>
                    <div className="font-medium truncate max-w-md">{r.title}</div>
                    <div className="text-xs text-text-muted">{r.category}</div>
                  </div>
                ),
              },
              {
                key: "score",
                header: "Residual",
                align: "center",
                cell: (r) => {
                  const { color, label } = riskScoreLabel(r.residualScore);
                  return (
                    <div className="text-center">
                      <div className={cn("text-base font-semibold tabular-nums", color)}>{r.residualScore}</div>
                      <div className={cn("text-[10px] uppercase tracking-wider", color)}>{label}</div>
                    </div>
                  );
                },
              },
              {
                key: "treatment",
                header: "Treatment",
                cell: (r) => <Badge>{r.treatment}</Badge>,
              },
              {
                key: "status",
                header: "Status",
                cell: (r) => <span className={cn("badge", statusBg(r.status))}>{r.status}</span>,
              },
            ]}
          />
        </div>
      </div>

      <DataTable
        rowKey={(r) => r.id}
        rows={risks}
        columns={[
          {
            key: "title",
            header: "Risk",
            cell: (r) => (
              <div>
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-text-muted line-clamp-1 max-w-xl">{r.description}</div>
              </div>
            ),
          },
          {
            key: "category",
            header: "Category",
            cell: (r) => <Badge>{r.category}</Badge>,
          },
          {
            key: "likelihood",
            header: "L × I",
            align: "center",
            cell: (r) => (
              <span className="text-sm tabular-nums text-text-muted">
                {r.likelihood} × {r.impact}
              </span>
            ),
          },
          {
            key: "inherent",
            header: "Inherent",
            align: "center",
            cell: (r) => {
              const { color } = riskScoreLabel(r.inherentScore);
              return <span className={cn("font-semibold tabular-nums", color)}>{r.inherentScore}</span>;
            },
          },
          {
            key: "residual",
            header: "Residual",
            align: "center",
            cell: (r) => {
              const { color, label } = riskScoreLabel(r.residualScore);
              return (
                <div className="text-center">
                  <div className={cn("text-base font-semibold tabular-nums", color)}>{r.residualScore}</div>
                  <div className={cn("text-[10px] uppercase tracking-wider", color)}>{label}</div>
                </div>
              );
            },
          },
          {
            key: "treatment",
            header: "Treatment",
            cell: (r) => <Badge>{r.treatment}</Badge>,
          },
          {
            key: "status",
            header: "Status",
            cell: (r) => <span className={cn("badge", statusBg(r.status))}>{r.status}</span>,
          },
          {
            key: "owner",
            header: "Owner",
            cell: (r) => <span className="text-sm">{r.owner?.name ?? "—"}</span>,
          },
          {
            key: "due",
            header: "Due",
            cell: (r) => <span className="text-sm text-text-muted">{formatDate(r.dueDate)}</span>,
          },
        ]}
      />
    </div>
  );
}
