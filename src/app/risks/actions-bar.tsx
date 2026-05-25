"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Modal from "@/components/ui/modal";
import { Field, FormGrid, TextInput, TextArea, Select, Checkbox } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { downloadCSV, toCSV } from "@/lib/csv";
import { createRisk } from "./actions";

interface UserOption { id: string; name: string }
interface RiskRow {
  title: string;
  description: string;
  category: string;
  likelihood: number;
  impact: number;
  inherentScore: number;
  residualScore: number;
  status: string;
  treatment: string;
  owner: { name: string } | null;
  dueDate: Date | string | null;
}

const FRAMEWORKS = ["PRIVACY_ACT", "NDB", "SOCI", "APRA_CPS234", "ESSENTIAL8", "CDR", "PCI_DSS", "ISO27001", "SOC2"];

export default function RisksActions({ users, risks }: { users: UserOption[]; risks: RiskRow[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "cyber",
    likelihood: 3,
    impact: 3,
    treatment: "mitigate",
    mitigationPlan: "",
    ownerId: "",
    dueDate: "",
    frameworkRefs: [] as string[],
  });

  function toggleFramework(code: string) {
    setForm((f) => ({
      ...f,
      frameworkRefs: f.frameworkRefs.includes(code)
        ? f.frameworkRefs.filter((x) => x !== code)
        : [...f.frameworkRefs, code],
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createRisk({
          title: form.title,
          description: form.description,
          category: form.category,
          likelihood: form.likelihood,
          impact: form.impact,
          treatment: form.treatment,
          mitigationPlan: form.mitigationPlan,
          ownerId: form.ownerId || null,
          dueDate: form.dueDate || null,
          frameworkRefs: form.frameworkRefs,
        });
        toast("Risk logged", "success");
        setOpen(false);
        setForm({
          title: "",
          description: "",
          category: "cyber",
          likelihood: 3,
          impact: 3,
          treatment: "mitigate",
          mitigationPlan: "",
          ownerId: "",
          dueDate: "",
          frameworkRefs: [],
        });
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to log risk", "error");
      }
    });
  }

  function exportCsv() {
    const csv = toCSV(risks, [
      { header: "Title", value: (r) => r.title },
      { header: "Description", value: (r) => r.description },
      { header: "Category", value: (r) => r.category },
      { header: "Likelihood", value: (r) => r.likelihood },
      { header: "Impact", value: (r) => r.impact },
      { header: "Inherent", value: (r) => r.inherentScore },
      { header: "Residual", value: (r) => r.residualScore },
      { header: "Treatment", value: (r) => r.treatment },
      { header: "Status", value: (r) => r.status },
      { header: "Owner", value: (r) => r.owner?.name ?? "" },
      { header: "Due", value: (r) => r.dueDate ?? "" },
    ]);
    downloadCSV(`risks-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast(`Exported ${risks.length} risks`, "success");
  }

  return (
    <>
      <button type="button" className="btn" onClick={exportCsv}>Export</button>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>+ Log risk</button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Log risk"
        description="Add an inherent risk to the register. Residual is auto-computed from the selected treatment."
        size="lg"
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
            <button type="submit" form="risk-form" className="btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Log risk"}
            </button>
          </>
        }
      >
        <form id="risk-form" onSubmit={submit} className="space-y-4">
          <Field label="Title">
            <TextInput required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Insufficient SaaS vendor due diligence" />
          </Field>
          <Field label="Description">
            <TextArea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <FormGrid cols={3}>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="cyber">Cyber</option>
                <option value="privacy">Privacy</option>
                <option value="operational">Operational</option>
                <option value="supply_chain">Supply chain</option>
                <option value="compliance">Compliance</option>
                <option value="third_party">Third party</option>
              </Select>
            </Field>
            <Field label="Likelihood (1-5)">
              <Select value={form.likelihood} onChange={(e) => setForm({ ...form, likelihood: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </Field>
            <Field label="Impact (1-5)">
              <Select value={form.impact} onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </Select>
            </Field>
          </FormGrid>
          <FormGrid cols={3}>
            <Field label="Treatment">
              <Select value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })}>
                <option value="mitigate">Mitigate</option>
                <option value="accept">Accept</option>
                <option value="transfer">Transfer</option>
                <option value="avoid">Avoid</option>
              </Select>
            </Field>
            <Field label="Owner">
              <Select value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </Field>
            <Field label="Due date">
              <TextInput type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </Field>
          </FormGrid>
          <Field label="Mitigation plan">
            <TextArea value={form.mitigationPlan} onChange={(e) => setForm({ ...form, mitigationPlan: e.target.value })} placeholder="High-level treatment plan, owners, milestones" />
          </Field>
          <Field label="Linked frameworks">
            <div className="flex flex-wrap gap-2 mt-1">
              {FRAMEWORKS.map((code) => (
                <Checkbox
                  key={code}
                  label={code}
                  checked={form.frameworkRefs.includes(code)}
                  onChange={() => toggleFramework(code)}
                />
              ))}
            </div>
          </Field>
        </form>
      </Modal>
    </>
  );
}
