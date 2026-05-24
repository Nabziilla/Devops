import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate, severityBg, statusBg } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AssetDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      owner: true,
      vulnerabilities: { orderBy: { discoveredAt: "desc" } },
      controlLinks: { include: { control: { include: { framework: true } } } },
      changes: { orderBy: { createdAt: "desc" }, take: 8 },
    },
  });

  if (!asset) notFound();

  const flags: { label: string; on: boolean }[] = [
    { label: "Encryption at rest", on: asset.encryptionAtRest },
    { label: "Encryption in transit", on: asset.encryptionInTransit },
    { label: "MFA enforced", on: asset.mfaEnforced },
    { label: "EDR installed", on: asset.edrInstalled },
    { label: "Backup configured", on: asset.backupConfigured },
    { label: "Backup encrypted", on: asset.backupEncrypted },
    { label: "Public exposure", on: !asset.publicExposure },
    { label: "Cross-border transfer", on: !asset.crossBorderTransfer },
  ];

  return (
    <div>
      <Link href="/assets" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-text mb-4">
        <ArrowLeft className="size-4" /> Back to assets
      </Link>
      <PageHeader
        title={asset.name}
        description={`${asset.type} · ${asset.cloudProvider ?? "on-prem"} · ${asset.region ?? ""} · ${asset.environment}`}
        actions={
          <>
            <span className={cn("badge", severityBg(asset.criticality))}>{asset.criticality}</span>
            <Badge>{asset.dataClassification}</Badge>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card p-4 lg:col-span-2">
          <div className="text-sm font-medium mb-3">Security & Compliance Posture</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {flags.map((f) => (
              <div
                key={f.label}
                className={cn(
                  "p-2.5 rounded-md border text-xs",
                  f.on ? "bg-risk-low/10 border-risk-low/40 text-risk-low" : "bg-risk-critical/10 border-risk-critical/40 text-risk-critical"
                )}
              >
                <div className="font-medium">{f.on ? "✓" : "✕"} {f.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border-subtle text-sm">
            <Detail label="Owner" value={asset.owner?.name ?? "—"} />
            <Detail label="Region" value={asset.region ?? "—"} />
            <Detail label="Patch status" value={asset.patchStatus} />
            <Detail label="Last patched" value={formatDate(asset.lastPatchedAt)} />
            <Detail label="Retention days" value={asset.retentionDays?.toString() ?? "—"} />
            <Detail label="Created" value={formatDate(asset.createdAt)} />
          </div>
        </div>

        <div className="card p-4">
          <div className="text-sm font-medium mb-3">Regulatory Scope</div>
          <div className="space-y-2 text-sm">
            <Toggle label="Privacy Act (PII)" on={asset.containsPII} />
            <Toggle label="My Health Records" on={asset.containsHealthData} />
            <Toggle label="PCI DSS" on={asset.containsCardData} />
            <Toggle label="SOCI Act 2018" on={asset.soci} />
            <Toggle label="Consumer Data Right" on={asset.cdr} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="p-4 border-b border-border text-sm font-medium">
            Vulnerabilities ({asset.vulnerabilities.length})
          </div>
          <div className="divide-y divide-border-subtle">
            {asset.vulnerabilities.length === 0 && (
              <div className="p-6 text-sm text-text-muted text-center">No vulnerabilities tracked</div>
            )}
            {asset.vulnerabilities.slice(0, 8).map((v) => (
              <div key={v.id} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{v.cveId ?? "—"} · {v.title}</div>
                  <div className="text-xs text-text-muted">CVSS {v.cvssScore ?? "—"} · {formatDate(v.discoveredAt)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("badge", severityBg(v.severity))}>{v.severity}</span>
                  <span className={cn("badge", statusBg(v.status))}>{v.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-border text-sm font-medium">
            Mapped Controls ({asset.controlLinks.length})
          </div>
          <div className="divide-y divide-border-subtle">
            {asset.controlLinks.length === 0 && (
              <div className="p-6 text-sm text-text-muted text-center">No controls mapped</div>
            )}
            {asset.controlLinks.map(({ control }) => (
              <div key={control.id} className="px-4 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{control.code} · {control.title}</div>
                  <div className="text-xs text-text-muted">{control.framework.code} · {control.category}</div>
                </div>
                <span className={cn("badge", statusBg(control.status))}>{control.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-text-dim uppercase tracking-wider">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

function Toggle({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <span className={cn("badge", on ? "border-primary/40 text-primary bg-primary/10" : "border-border text-text-dim bg-bg-hover")}>
        {on ? "In scope" : "Not applicable"}
      </span>
    </div>
  );
}
