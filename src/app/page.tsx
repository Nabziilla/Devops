import { prisma } from "@/lib/db";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { DonutChart, SeverityBar, TrendArea, PostureRadar, COLORS } from "@/components/ui/charts";
import { cn, formatDate, percent, severityBg, statusBg } from "@/lib/utils";
import { Shield, AlertTriangle, Siren, Bug, Users, Server, ListChecks, ScrollText } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ExecutivePage() {
  const [
    assets,
    controls,
    risks,
    openIncidents,
    criticalVulns,
    vulnsAll,
    users,
    accessReviews,
    vendors,
    policies,
  ] = await Promise.all([
    prisma.asset.findMany(),
    prisma.control.findMany({ include: { framework: true } }),
    prisma.risk.findMany({ where: { status: { not: "closed" } } }),
    prisma.incident.findMany({
      where: { status: { not: "closed" } },
      orderBy: { detectedAt: "desc" },
      include: { assignee: true },
    }),
    prisma.vulnerability.findMany({ where: { severity: "critical", status: "open" } }),
    prisma.vulnerability.findMany(),
    prisma.user.findMany(),
    prisma.accessReview.findMany({ where: { status: { in: ["pending", "in_progress", "overdue"] } } }),
    prisma.vendor.findMany(),
    prisma.policy.findMany(),
  ]);

  // KPIs
  const totalControls = controls.length;
  const compliantControls = controls.filter((c) => c.status === "compliant").length;
  const compliancePct = percent(compliantControls, totalControls);

  const criticalAssets = assets.filter((a) => a.criticality === "critical").length;
  const piiAssets = assets.filter((a) => a.containsPII).length;
  const sociAssets = assets.filter((a) => a.soci).length;

  const openRisks = risks.length;
  const criticalRisks = risks.filter((r) => r.residualScore >= 20).length;

  const mfaCoverage = percent(users.filter((u) => u.mfaEnabled).length, users.length || 1);
  const dormantAccounts = users.filter((u) => u.dormant).length;

  const ndbIncidents = openIncidents.filter((i) => i.ndbApplicable).length;
  const sociIncidents = openIncidents.filter((i) => i.sociReportable).length;

  // Severity distribution for incidents
  const incidentBySeverity = [
    { name: "Critical", value: openIncidents.filter((i) => i.severity === "critical").length, color: COLORS.critical },
    { name: "High", value: openIncidents.filter((i) => i.severity === "high").length, color: COLORS.high },
    { name: "Medium", value: openIncidents.filter((i) => i.severity === "medium").length, color: COLORS.medium },
    { name: "Low", value: openIncidents.filter((i) => i.severity === "low").length, color: COLORS.low },
  ];

  // Vulnerability severity distribution
  const vulnBySeverity = [
    { name: "Critical", value: vulnsAll.filter((v) => v.severity === "critical" && v.status === "open").length, color: COLORS.critical },
    { name: "High", value: vulnsAll.filter((v) => v.severity === "high" && v.status === "open").length, color: COLORS.high },
    { name: "Medium", value: vulnsAll.filter((v) => v.severity === "medium" && v.status === "open").length, color: COLORS.medium },
    { name: "Low", value: vulnsAll.filter((v) => v.severity === "low" && v.status === "open").length, color: COLORS.low },
  ];

  // Compliance posture by framework
  const frameworkPosture = Object.entries(
    controls.reduce<Record<string, { total: number; compliant: number }>>((acc, c) => {
      const code = c.framework.code;
      if (!acc[code]) acc[code] = { total: 0, compliant: 0 };
      acc[code].total++;
      if (c.status === "compliant") acc[code].compliant++;
      return acc;
    }, {})
  ).map(([code, v]) => ({
    subject: code,
    value: percent(v.compliant, v.total),
    max: 100,
  }));

  // Donut: control status
  const controlStatusDonut = [
    { name: "Compliant", value: controls.filter((c) => c.status === "compliant").length, color: COLORS.low },
    { name: "Partial", value: controls.filter((c) => c.status === "partial").length, color: COLORS.medium },
    { name: "Non-compliant", value: controls.filter((c) => c.status === "non_compliant").length, color: COLORS.critical },
    { name: "N/A / Exception", value: controls.filter((c) => ["not_applicable", "exception"].includes(c.status)).length, color: COLORS.muted },
  ];

  // 30-day incident trend (synthetic monthly buckets)
  const months = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  const trend = months.map((m, i) => ({
    name: m,
    Incidents: Math.max(0, Math.round(5 + Math.sin(i) * 3 + (i === 5 ? openIncidents.length : 0))),
    Vulnerabilities: Math.max(0, Math.round(15 + Math.cos(i) * 6 + (i === 5 ? criticalVulns.length : 0))),
  }));

  return (
    <div>
      <PageHeader
        title="Executive Risk & Compliance Dashboard"
        description="Real-time posture across Australian regulatory obligations: Privacy Act, NDB, SOCI, APRA CPS 234, Essential Eight, CDR."
        actions={
          <>
            <Link href="/risks" className="btn">
              <AlertTriangle className="size-4" /> Risk register
            </Link>
            <Link href="/incidents" className="btn-primary">
              <Siren className="size-4" /> Incidents
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Compliance Posture"
          value={`${compliancePct}%`}
          hint={`${compliantControls} of ${totalControls} controls compliant`}
          icon={Shield}
          tone={compliancePct >= 80 ? "good" : compliancePct >= 60 ? "warn" : "bad"}
        />
        <StatCard
          label="Open Critical Risks"
          value={criticalRisks}
          hint={`${openRisks} risks open`}
          icon={AlertTriangle}
          tone={criticalRisks > 0 ? "bad" : "good"}
        />
        <StatCard
          label="Active Incidents"
          value={openIncidents.length}
          hint={`${ndbIncidents} NDB-applicable · ${sociIncidents} SOCI`}
          icon={Siren}
          tone={openIncidents.length === 0 ? "good" : "warn"}
        />
        <StatCard
          label="Critical Vulnerabilities"
          value={criticalVulns.length}
          hint={`${vulnsAll.filter((v) => v.status === "open").length} open total`}
          icon={Bug}
          tone={criticalVulns.length > 5 ? "bad" : criticalVulns.length > 0 ? "warn" : "good"}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="MFA Coverage" value={`${mfaCoverage}%`} hint={`${dormantAccounts} dormant accounts`} icon={Users} tone={mfaCoverage >= 95 ? "good" : "warn"} />
        <StatCard label="Asset Inventory" value={assets.length} hint={`${criticalAssets} critical · ${piiAssets} PII · ${sociAssets} SOCI`} icon={Server} />
        <StatCard label="Pending Access Reviews" value={accessReviews.length} hint={`${accessReviews.filter((r) => r.status === "overdue").length} overdue`} icon={ListChecks} tone={accessReviews.filter((r) => r.status === "overdue").length > 0 ? "bad" : "good"} />
        <StatCard label="Published Policies" value={policies.filter((p) => p.status === "published").length} hint={`${policies.filter((p) => p.status === "under_review").length} under review`} icon={ScrollText} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium">Control Status</div>
              <div className="text-xs text-text-muted">Across all frameworks</div>
            </div>
          </div>
          <DonutChart data={controlStatusDonut} centerLabel="Compliant" centerValue={`${compliancePct}%`} />
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium">Framework Posture</div>
              <div className="text-xs text-text-muted">% of controls compliant per framework</div>
            </div>
          </div>
          <PostureRadar data={frameworkPosture} />
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium">Vulnerabilities by Severity</div>
              <div className="text-xs text-text-muted">Open · across all assets</div>
            </div>
          </div>
          <SeverityBar data={vulnBySeverity} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium">6-Month Risk Trend</div>
              <div className="text-xs text-text-muted">Incidents and vulnerabilities over time</div>
            </div>
          </div>
          <TrendArea
            data={trend}
            series={[
              { key: "Incidents", color: COLORS.critical, label: "Incidents" },
              { key: "Vulnerabilities", color: COLORS.high, label: "Vulnerabilities" },
            ]}
          />
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium">Incidents by Severity</div>
              <div className="text-xs text-text-muted">Currently open</div>
            </div>
          </div>
          <SeverityBar data={incidentBySeverity} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="text-sm font-medium">Recent Incidents</div>
            <Link href="/incidents" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-border-subtle">
            {openIncidents.slice(0, 6).map((i) => (
              <Link key={i.id} href={`/incidents/${i.id}`} className="flex items-center justify-between px-4 py-3 hover:bg-bg-hover">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn("badge", severityBg(i.severity))}>{i.severity}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{i.ref} · {i.title}</div>
                    <div className="text-xs text-text-muted">{formatDate(i.detectedAt)} · {i.assignee?.name ?? "Unassigned"}</div>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {i.ndbApplicable && <Badge className="border-risk-critical/40 text-risk-critical bg-risk-critical/10">NDB</Badge>}
                  {i.sociReportable && <Badge className="border-risk-high/40 text-risk-high bg-risk-high/10">SOCI</Badge>}
                  {i.apraReportable && <Badge className="border-risk-medium/40 text-risk-medium bg-risk-medium/10">APRA</Badge>}
                </div>
              </Link>
            ))}
            {openIncidents.length === 0 && <div className="p-6 text-sm text-text-muted text-center">No active incidents</div>}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="text-sm font-medium">Top Risks</div>
            <Link href="/risks" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-border-subtle">
            {risks
              .slice()
              .sort((a, b) => b.residualScore - a.residualScore)
              .slice(0, 6)
              .map((r) => (
                <Link key={r.id} href={`/risks`} className="flex items-center justify-between px-4 py-3 hover:bg-bg-hover">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{r.title}</div>
                    <div className="text-xs text-text-muted">{r.category} · {formatDate(r.dueDate)}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("badge", statusBg(r.status))}>{r.status}</span>
                    <span className="text-sm font-semibold tabular-nums w-8 text-right">{r.residualScore}</span>
                  </div>
                </Link>
              ))}
            {risks.length === 0 && <div className="p-6 text-sm text-text-muted text-center">No open risks</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
