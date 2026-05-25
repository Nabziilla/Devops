"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Modal from "@/components/ui/modal";
import { Field, FormGrid, TextInput, TextArea, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { downloadCSV, toCSV } from "@/lib/csv";
import { createControl } from "./actions";

interface UserOption { id: string; name: string }
interface FrameworkOption { id: string; code: string; name: string }
interface ControlRow {
  code: string;
  title: string;
  description: string;
  category: string;
  status: string;
  maturity: number;
  validationFreq: string;
  lastValidated: Date | string | null;
  nextDue: Date | string | null;
  framework: { code: string };
  owner: { name: string } | null;
  evidence: { id: string }[];
}

export default function ControlsActions({ users, frameworks, controls }: { users: UserOption[]; frameworks: FrameworkOption[]; controls: ControlRow[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const empty = {
    code: "",
    title: "",
    description: "",
    category: "IAM",
    frameworkId: frameworks[0]?.id ?? "",
    status: "partial",
    maturity: 2,
    validationFreq: "quarterly",
    ownerId: "",
  };
  const [form, setForm] = useState(empty);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createControl({
          ...form,
          maturity: Number(form.maturity),
          ownerId: form.ownerId || null,
        });
        toast(`Control ${form.code} added`, "success");
        setOpen(false);
        setForm(empty);
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to add control", "error");
      }
    });
  }

  function exportPack() {
    const csv = toCSV(controls, [
      { header: "Code", value: (c) => c.code },
      { header: "Title", value: (c) => c.title },
      { header: "Description", value: (c) => c.description },
      { header: "Framework", value: (c) => c.framework.code },
      { header: "Category", value: (c) => c.category },
      { header: "Status", value: (c) => c.status },
      { header: "Maturity", value: (c) => c.maturity },
      { header: "Validation", value: (c) => c.validationFreq },
      { header: "Last validated", value: (c) => c.lastValidated ?? "" },
      { header: "Next due", value: (c) => c.nextDue ?? "" },
      { header: "Owner", value: (c) => c.owner?.name ?? "" },
      { header: "Evidence items", value: (c) => c.evidence.length },
    ]);
    downloadCSV(`evidence-pack-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast(`Exported pack for ${controls.length} controls`, "success");
  }

  return (
    <>
      <button type="button" className="btn" onClick={exportPack}>Export evidence pack</button>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>+ Add control</button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Add control"
        description="Define a new control in the library and bind it to a framework. A first validation date is scheduled from the cadence."
        size="lg"
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
            <button type="submit" form="control-form" className="btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Add control"}
            </button>
          </>
        }
      >
        <form id="control-form" onSubmit={submit} className="space-y-4">
          <FormGrid cols={2}>
            <Field label="Code">
              <TextInput required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="E.g. APRA-CPS234-3" />
            </Field>
            <Field label="Framework">
              <Select required value={form.frameworkId} onChange={(e) => setForm({ ...form, frameworkId: e.target.value })}>
                {frameworks.map((f) => <option key={f.id} value={f.id}>{f.code} — {f.name}</option>)}
              </Select>
            </Field>
          </FormGrid>
          <Field label="Title">
            <TextInput required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Description">
            <TextArea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <FormGrid cols={3}>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="IAM">IAM</option>
                <option value="NETWORK">Network</option>
                <option value="ENCRYPTION">Encryption</option>
                <option value="LOGGING">Logging</option>
                <option value="BACKUP">Backup</option>
                <option value="INCIDENT">Incident</option>
                <option value="PRIVACY">Privacy</option>
                <option value="SUPPLY_CHAIN">Supply chain</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="compliant">Compliant</option>
                <option value="partial">Partial</option>
                <option value="non_compliant">Non-compliant</option>
                <option value="not_applicable">Not applicable</option>
                <option value="exception">Exception</option>
              </Select>
            </Field>
            <Field label="Maturity (0-5)">
              <Select value={form.maturity} onChange={(e) => setForm({ ...form, maturity: Number(e.target.value) })}>
                {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </Field>
          </FormGrid>
          <FormGrid cols={2}>
            <Field label="Validation cadence">
              <Select value={form.validationFreq} onChange={(e) => setForm({ ...form, validationFreq: e.target.value })}>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </Select>
            </Field>
            <Field label="Owner">
              <Select value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </Field>
          </FormGrid>
        </form>
      </Modal>
    </>
  );
}
