"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Modal from "@/components/ui/modal";
import { Field, FormGrid, TextInput, Select, Checkbox } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { downloadCSV, toCSV } from "@/lib/csv";
import { createEvidence } from "./actions";

interface ControlOption { id: string; code: string; framework: { code: string } }
interface EvidenceRow {
  title: string;
  type: string;
  source: string;
  collectedBy: string;
  collectedAt: Date | string;
  retentionUntil: Date | string;
  immutable: boolean;
  reference: string | null;
  auditRef: string | null;
  control: { code: string; framework: { code: string } } | null;
}

export default function EvidenceActions({ controls, evidence }: { controls: ControlOption[]; evidence: EvidenceRow[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const empty = {
    title: "",
    type: "log_export",
    source: "aws_config",
    collectedBy: "console-user",
    controlId: "",
    reference: "",
    retentionDays: 2555, // 7 years
    immutable: true,
    auditRef: "",
  };
  const [form, setForm] = useState(empty);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createEvidence({
          ...form,
          retentionDays: Number(form.retentionDays),
          controlId: form.controlId || null,
        });
        toast("Evidence attached", "success");
        setOpen(false);
        setForm(empty);
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to attach evidence", "error");
      }
    });
  }

  function exportAuditPack() {
    const csv = toCSV(evidence, [
      { header: "Title", value: (e) => e.title },
      { header: "Type", value: (e) => e.type },
      { header: "Source", value: (e) => e.source },
      { header: "Collected by", value: (e) => e.collectedBy },
      { header: "Collected at", value: (e) => e.collectedAt },
      { header: "Retention until", value: (e) => e.retentionUntil },
      { header: "Immutable", value: (e) => (e.immutable ? "yes" : "no") },
      { header: "Control", value: (e) => e.control?.code ?? "" },
      { header: "Framework", value: (e) => e.control?.framework.code ?? "" },
      { header: "Reference", value: (e) => e.reference ?? "" },
      { header: "Audit ref", value: (e) => e.auditRef ?? "" },
    ]);
    downloadCSV(`audit-pack-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast(`Audit pack: ${evidence.length} items exported`, "success");
  }

  return (
    <>
      <button type="button" className="btn" onClick={exportAuditPack}>Audit pack</button>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>+ Attach evidence</button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Attach evidence"
        description="Record an evidence artefact and (optionally) bind it to a control. Default retention is 7 years."
        size="lg"
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
            <button type="submit" form="evidence-form" className="btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Attach evidence"}
            </button>
          </>
        }
      >
        <form id="evidence-form" onSubmit={submit} className="space-y-4">
          <Field label="Title">
            <TextInput required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. AWS Config rule snapshot — IAM password policy" />
          </Field>
          <FormGrid cols={3}>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="log_export">Log export</option>
                <option value="screenshot">Screenshot</option>
                <option value="report">Report</option>
                <option value="attestation">Attestation</option>
                <option value="scan_result">Scan result</option>
                <option value="policy_doc">Policy doc</option>
                <option value="test_evidence">Test evidence</option>
              </Select>
            </Field>
            <Field label="Source">
              <Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                <option value="aws_config">AWS Config</option>
                <option value="splunk">Splunk</option>
                <option value="manual">Manual</option>
                <option value="audit_tool">Audit tool</option>
              </Select>
            </Field>
            <Field label="Collected by">
              <TextInput value={form.collectedBy} onChange={(e) => setForm({ ...form, collectedBy: e.target.value })} />
            </Field>
          </FormGrid>
          <Field label="Control (optional)">
            <Select value={form.controlId} onChange={(e) => setForm({ ...form, controlId: e.target.value })}>
              <option value="">— none —</option>
              {controls.map((c) => <option key={c.id} value={c.id}>{c.framework.code} · {c.code}</option>)}
            </Select>
          </Field>
          <FormGrid cols={2}>
            <Field label="Reference (URL / storage key)">
              <TextInput value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="s3://compliance/...  or  https://..." />
            </Field>
            <Field label="Audit ref">
              <TextInput value={form.auditRef} onChange={(e) => setForm({ ...form, auditRef: e.target.value })} placeholder="ASIC-2025-Q3" />
            </Field>
          </FormGrid>
          <FormGrid cols={2}>
            <Field label="Retention (days)">
              <TextInput type="number" min={1} value={form.retentionDays} onChange={(e) => setForm({ ...form, retentionDays: Number(e.target.value) })} />
            </Field>
            <Field label="Mutability">
              <div className="pt-2">
                <Checkbox label="Immutable (locked)" checked={form.immutable} onChange={(e) => setForm({ ...form, immutable: e.target.checked })} />
              </div>
            </Field>
          </FormGrid>
        </form>
      </Modal>
    </>
  );
}
