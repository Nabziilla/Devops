import PageHeader from "@/components/ui/page-header";
import Link from "next/link";
import { Siren, ShieldAlert, BellRing, Clock } from "lucide-react";

const phases = [
  {
    code: "1",
    title: "Detect & triage",
    icon: Siren,
    sla: "Within 15 minutes of alert",
    steps: [
      "Open the incident in the console (+ Log incident). Assign a severity using the matrix below.",
      "Identify affected assets and confirm whether PII, health data, card data, or SOCI-in-scope assets are involved.",
      "Page primary on-call. Critical / High severity also pages the executive responder.",
    ],
  },
  {
    code: "2",
    title: "Contain",
    icon: ShieldAlert,
    sla: "Critical: ≤1h · High: ≤4h",
    steps: [
      "Isolate affected hosts (EDR network containment), rotate exposed credentials, revoke sessions.",
      "Snapshot evidence before remediation: memory image, relevant logs, network captures.",
      "Mark the incident as contained and record the containment timestamp.",
    ],
  },
  {
    code: "3",
    title: "Assess regulatory obligations",
    icon: BellRing,
    sla: "NDB assessment ≤ 30 days · SOCI 12–72h",
    steps: [
      "Notifiable Data Breach (NDB) — if eligible data breach involving personal information likely to cause serious harm, notify the OAIC and affected individuals as soon as practicable.",
      "SOCI Act — cyber incidents impacting critical infrastructure: 12 hours for critical impact, 72 hours otherwise. Notify ASD/ACSC.",
      "APRA CPS 234 — APRA-regulated entities: notify APRA within 72 hours of a material information security incident.",
    ],
  },
  {
    code: "4",
    title: "Eradicate & recover",
    icon: Clock,
    sla: "Recovery objective per asset criticality",
    steps: [
      "Remove the root cause: patch, revoke, reimage. Validate via re-scan / red-team replay.",
      "Restore from clean backups, verify integrity, confirm monitoring is in place before unwinding containment.",
      "Update the incident with rootCause, lessonsLearned and link evidence collected throughout.",
    ],
  },
];

const severityMatrix = [
  { sev: "Critical", criteria: "Active exfiltration of restricted data, prod outage > 1h, ransomware spread", page: "All hands + Exec sponsor" },
  { sev: "High", criteria: "Successful intrusion contained, PII exposure, single critical asset down", page: "Security on-call + Service owner" },
  { sev: "Medium", criteria: "Attempted intrusion, misconfiguration with confidentiality impact", page: "Security on-call" },
  { sev: "Low", criteria: "Policy violation, scan finding under investigation", page: "Async ticket" },
];

export default function RunbookPage() {
  return (
    <div>
      <PageHeader
        title="Incident Response Runbook"
        description="Operational playbook covering detection, containment, regulatory notification, and recovery. Aligned with the NDB Scheme, SOCI Act, and APRA CPS 234."
        actions={
          <Link href="/incidents" className="btn">← Back to incidents</Link>
        }
      />

      <div className="grid gap-4">
        {phases.map((p) => {
          const Icon = p.icon;
          return (
            <div key={p.code} className="card p-5">
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Icon className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-4 flex-wrap">
                    <h2 className="text-lg font-semibold">
                      Phase {p.code}. {p.title}
                    </h2>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">{p.sla}</span>
                  </div>
                  <ol className="mt-3 space-y-2 text-sm text-foreground/90 list-decimal list-inside marker:text-muted-foreground">
                    {p.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          );
        })}

        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-3">Severity matrix</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
            {severityMatrix.map((s) => (
              <div key={s.sev} className="border border-border rounded-lg p-3">
                <div className="font-semibold mb-1">{s.sev}</div>
                <div className="text-xs text-muted-foreground mb-2">{s.criteria}</div>
                <div className="text-xs"><span className="text-muted-foreground">Paging: </span>{s.page}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
