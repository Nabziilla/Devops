import { prisma } from "@/lib/db";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import DataTable from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Users, KeyRound, UserX, ShieldCheck } from "lucide-react";
import { cn, formatDate, percent, statusBg } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function IAMPage() {
  const [users, reviews] = await Promise.all([
    prisma.user.findMany({ orderBy: [{ privileged: "desc" }, { name: "asc" }] }),
    prisma.accessReview.findMany({ include: { reviewer: true }, orderBy: { scheduledFor: "desc" } }),
  ]);

  const mfaCoverage = percent(users.filter((u) => u.mfaEnabled).length, users.length || 1);
  const privileged = users.filter((u) => u.privileged);
  const privilegedMfa = percent(privileged.filter((u) => u.mfaEnabled).length, privileged.length || 1);
  const dormant = users.filter((u) => u.dormant);

  return (
    <div>
      <PageHeader
        title="Identity & Access Management"
        description="Workforce identity posture: MFA coverage, privileged accounts, dormant users, and quarterly access review cadence."
        actions={
          <>
            <button className="btn">Export user audit</button>
            <button className="btn-primary">+ Schedule review</button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="MFA Coverage" value={`${mfaCoverage}%`} icon={ShieldCheck} tone={mfaCoverage >= 95 ? "good" : "warn"} />
        <StatCard label="Privileged Accounts" value={privileged.length} hint={`${privilegedMfa}% MFA`} icon={KeyRound} tone={privilegedMfa === 100 ? "good" : "bad"} />
        <StatCard label="Dormant Accounts" value={dormant.length} hint="No login in 90+ days" icon={UserX} tone={dormant.length > 0 ? "warn" : "good"} />
        <StatCard label="Total Users" value={users.length} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card lg:col-span-2">
          <div className="p-4 border-b border-border text-sm font-medium">Users</div>
          <DataTable
            rowKey={(u) => u.id}
            rows={users}
            columns={[
              { key: "name", header: "User", cell: (u) => (
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-text-muted">{u.email}</div>
                </div>
              )},
              { key: "role", header: "Role", cell: (u) => <Badge>{u.role}</Badge> },
              { key: "dept", header: "Department", cell: (u) => <span className="text-sm text-text-muted">{u.department ?? "—"}</span> },
              { key: "mfa", header: "MFA", align: "center", cell: (u) => (
                <Badge className={u.mfaEnabled ? "border-risk-low/40 text-risk-low bg-risk-low/10" : "border-risk-critical/40 text-risk-critical bg-risk-critical/10"}>
                  {u.mfaEnabled ? "Enabled" : "Disabled"}
                </Badge>
              )},
              { key: "priv", header: "Privileged", align: "center", cell: (u) =>
                u.privileged ? <Badge className="border-risk-medium/40 text-risk-medium bg-risk-medium/10">Yes</Badge> : <span className="text-xs text-text-dim">—</span>
              },
              { key: "dormant", header: "Status", cell: (u) =>
                u.dormant ? <Badge className="border-risk-medium/40 text-risk-medium bg-risk-medium/10">Dormant</Badge> : <Badge className="border-risk-low/40 text-risk-low bg-risk-low/10">Active</Badge>
              },
              { key: "last", header: "Last login", cell: (u) => <span className="text-sm text-text-muted">{formatDate(u.lastLoginAt)}</span> },
            ]}
          />
        </div>

        <div className="card">
          <div className="p-4 border-b border-border text-sm font-medium">Access Reviews</div>
          <div className="divide-y divide-border-subtle">
            {reviews.map((r) => (
              <div key={r.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="font-medium text-sm">{r.scope}</div>
                  <span className={cn("badge", statusBg(r.status))}>{r.status.replace("_", " ")}</span>
                </div>
                <div className="text-xs text-text-muted">Reviewer: {r.reviewer.name}</div>
                <div className="text-xs text-text-muted">Scheduled: {formatDate(r.scheduledFor)}</div>
                {r.findings && <div className="text-xs mt-1 text-text-muted line-clamp-2">{r.findings}</div>}
              </div>
            ))}
            {reviews.length === 0 && <div className="p-6 text-sm text-text-muted text-center">No reviews</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
