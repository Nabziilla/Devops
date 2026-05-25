"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Modal from "@/components/ui/modal";
import { Field, FormGrid, TextInput, TextArea, Select, Checkbox } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { createPolicy } from "./actions";

const FRAMEWORKS = ["PRIVACY_ACT", "NDB", "SOCI", "APRA_CPS234", "ESSENTIAL8", "CDR", "PCI_DSS", "ISO27001", "SOC2"];

const TEMPLATES = [
  { code: "POL-PRIV-001", title: "Information Privacy Policy", category: "privacy", summary: "How we collect, use, store and disclose personal information under the Privacy Act 1988 and APPs." },
  { code: "POL-SEC-001", title: "Information Security Policy", category: "security", summary: "High-level security objectives aligned to APRA CPS 234 and ISO 27001 Annex A." },
  { code: "POL-RET-001", title: "Data Retention & Destruction Policy", category: "retention", summary: "Retention schedules by data class, secure disposal procedures." },
  { code: "POL-AUP-001", title: "Acceptable Use Policy", category: "acceptable_use", summary: "Acceptable use of corporate systems, BYOD, and AI tooling." },
  { code: "POL-IR-001", title: "Incident Response Policy", category: "incident", summary: "Detection, containment, notification (NDB / SOCI / APRA) and recovery roles and responsibilities." },
  { code: "POL-CM-001", title: "Change Management Policy", category: "change", summary: "Standard, normal, and emergency change procedures with approval thresholds." },
];

export default function PoliciesActions() {
  const [open, setOpen] = useState(false);
  const [libOpen, setLibOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const empty = {
    code: "",
    title: "",
    category: "security",
    version: "1.0",
    owner: "",
    summary: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    frameworkRefs: [] as string[],
  };
  const [form, setForm] = useState(empty);

  function toggle(code: string) {
    setForm((f) => ({
      ...f,
      frameworkRefs: f.frameworkRefs.includes(code) ? f.frameworkRefs.filter((x) => x !== code) : [...f.frameworkRefs, code],
    }));
  }

  function applyTemplate(t: typeof TEMPLATES[number]) {
    setForm({
      ...empty,
      code: t.code,
      title: t.title,
      category: t.category,
      summary: t.summary,
    });
    setLibOpen(false);
    setOpen(true);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createPolicy(form);
        toast(`Policy ${form.code} created`, "success");
        setOpen(false);
        setForm(empty);
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to create policy", "error");
      }
    });
  }

  return (
    <>
      <button type="button" className="btn" onClick={() => setLibOpen(true)}>Open policy library</button>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>+ New policy</button>

      <Modal
        open={libOpen}
        onClose={() => setLibOpen(false)}
        title="Policy library"
        description="Start from a vetted template. Each template seeds the new-policy form with sensible defaults."
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.code}
              type="button"
              onClick={() => applyTemplate(t)}
              className="text-left p-4 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="font-mono text-xs text-primary">{t.code}</div>
              <div className="font-medium mt-1">{t.title}</div>
              <div className="text-xs text-muted-foreground mt-1.5 line-clamp-3">{t.summary}</div>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="New policy"
        size="lg"
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
            <button type="submit" form="policy-form" className="btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Create policy"}
            </button>
          </>
        }
      >
        <form id="policy-form" onSubmit={submit} className="space-y-4">
          <FormGrid cols={2}>
            <Field label="Code">
              <TextInput required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="POL-SEC-002" />
            </Field>
            <Field label="Version">
              <TextInput value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="1.0" />
            </Field>
          </FormGrid>
          <Field label="Title">
            <TextInput required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <FormGrid cols={2}>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="privacy">Privacy</option>
                <option value="security">Security</option>
                <option value="retention">Retention</option>
                <option value="acceptable_use">Acceptable use</option>
                <option value="incident">Incident</option>
                <option value="change">Change</option>
              </Select>
            </Field>
            <Field label="Owner">
              <TextInput required value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })} placeholder="CISO / Privacy Officer" />
            </Field>
          </FormGrid>
          <FormGrid cols={2}>
            <Field label="Effective date">
              <TextInput type="date" required value={form.effectiveDate} onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })} />
            </Field>
            <Field label="Next review">
              <TextInput type="date" required value={form.reviewDate} onChange={(e) => setForm({ ...form, reviewDate: e.target.value })} />
            </Field>
          </FormGrid>
          <Field label="Summary">
            <TextArea required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </Field>
          <Field label="Linked frameworks">
            <div className="flex flex-wrap gap-2 mt-1">
              {FRAMEWORKS.map((c) => (
                <Checkbox key={c} label={c} checked={form.frameworkRefs.includes(c)} onChange={() => toggle(c)} />
              ))}
            </div>
          </Field>
        </form>
      </Modal>
    </>
  );
}
