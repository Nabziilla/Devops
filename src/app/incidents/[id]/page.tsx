import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateTime, severityBg, statusBg } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function IncidentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      assignee: true,
      assets: { include: { asset: true } },
      timeline: { orderBy: { occurredAt: "asc" } },
    },
  });

  if (!incident) notFound();

  const now = Date.now();
  const detected = new Date(incident.detectedAt).getTime();
  const hoursElapsed = (now - detected) / (1000 * 60 * 60);

  const obligations: { key: string; label: string; deadline?: string; satisfied: boolean; reportedAt?: Date | null }[] = [];
  if (incident.ndbApplicable) {
    obligations.push({
      key: "ndb",
      label: "OAIC notification (NDB Scheme)",
      deadline: "ASAP after assessment (~72h)",
      satisfied: incident.ndbNotifiedOaic,
      reportedAt: incident.ndbNotificationDate,
    });
    obligations.push({
      key: "users",
      label: "Affected individuals notification",
      deadline: "Without undue delay",
      satisfied: incident.ndbNotifiedUsers,
    });
  }
  if (incident.sociReportable) {
    obligations.push({
      key: "soci",
      label: "Home Affairs (SOCI Act)",
      deadline: "12h critical · 72h other",
      satisfied: !!incident.sociReportedAt,
      reportedAt: incident.sociReportedAt,
    });
  }
  if (incident.apraReportable) {
    obligations.push({
      key: "apra",
      label: "APRA (CPS 234 material incident)",
      deadline: "72h",
      satisfied: !!incident.apraReportedAt,
      reportedAt: incident.apraReportedAt,
    });
  }

  return (
    <div>
      <Link href="/incidents" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4">
        <ArrowLeft className="size-4" /> Back to incidents
      </Link>
      <PageHeader
        title={`${incident.ref} · ${incident.title}`}
        description={incident.description}
        actions={
          <>
            <span className={cn("badge", severityBg(incident.severity))}>{incident.severity}</span>
            <span className={cn("badge", statusBg(incident.status))}>{incident.status.replace("_", " ")}</span>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KV label="Detected" value={formatDateTime(incident.detectedAt)} />
        <KV label="Detection source" value={incident.detectionSource} />
        <KV label="Records affected" value={incident.recordsAffected?.toLocaleString() ?? "—"} />
        <KV label="Assignee" value={incident.assignee?.name ?? "Unassigned"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 lg:col-span-2">
          <div className="text-sm font-medium mb-3">Regulatory Obligations</div>
          {obligations.length === 0 && (
            <div className="text-sm text-text-muted">No mandatory regulatory notifications triggered.</div>
          )}
          <div className="space-y-2">
            {obligations.map((o) => {
              const overdue = !o.satisfied && hoursElapsed > 72;
              return (
                <div key={o.key} className={cn(
                  "p-3 rounded-md border flex items-center justify-between",
                  o.satisfied ? "border-risk-low/40 bg-risk-low/10" :
                  overdue ? "border-risk-critical/40 bg-risk-critical/10" : "border-risk-medium/40 bg-risk-medium/10"
                )}>
                  <div className="flex items-center gap-2">
                    {o.satisfied ? <CheckCircle2 className="size-4 text-risk-low" /> : <AlertCircle className={cn("size-4", overdue ? "text-risk-critical" : "text-risk-medium")} />}
                    <div>
                      <div className="font-medium text-sm">{o.label}</div>
                      {o.deadline && <div className="text-xs text-text-muted">Deadline: {o.deadline}</div>}
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    {o.satisfied && o.reportedAt && <div className="text-risk-low">Reported {formatDateTime(o.reportedAt)}</div>}
                    {!o.satisfied && <div className={overdue ? "text-risk-critical" : "text-risk-medium"}>{hoursElapsed.toFixed(1)}h elapsed</div>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6">
            <div className="text-sm font-medium mb-3">Timeline</div>
            <div className="space-y-2">
              {incident.timeline.map((e) => (
                <div key={e.id} className="flex gap-3 text-sm">
                  <div className="w-32 shrink-0 text-text-muted text-xs">{formatDateTime(e.occurredAt)}</div>
                  <div className="flex-1">
                    <span className="font-medium">{e.eventType}</span>
                    <span className="text-text-muted"> · {e.description}</span>
                    <span className="text-text-dim text-xs"> · {e.actor}</span>
                  </div>
                </div>
              ))}
              {incident.timeline.length === 0 && <div className="text-sm text-text-muted">No timeline events recorded.</div>}
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="text-sm font-medium mb-3">Affected Assets</div>
          <div className="space-y-2">
            {incident.assets.map(({ asset }) => (
              <Link key={asset.id} href={`/assets/${asset.id}`} className="block p-2 rounded-md border border-border hover:bg-bg-hover">
                <div className="text-sm font-medium">{asset.name}</div>
                <div className="text-xs text-text-muted">{asset.type} · {asset.environment}</div>
                <div className="flex gap-1 mt-1">
                  <span className={cn("badge", severityBg(asset.criticality))}>{asset.criticality}</span>
                  {asset.containsPII && <Badge className="border-primary/40 text-primary bg-primary/10">PII</Badge>}
                </div>
              </Link>
            ))}
            {incident.assets.length === 0 && <div className="text-sm text-text-muted">None recorded.</div>}
          </div>

          {incident.rootCause && (
            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Root cause</div>
              <p className="text-sm text-text-muted">{incident.rootCause}</p>
            </div>
          )}
          {incident.lessonsLearned && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Lessons learned</div>
              <p className="text-sm text-text-muted">{incident.lessonsLearned}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <div className="text-xs text-text-dim uppercase tracking-wider">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
