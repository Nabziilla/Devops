"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Modal from "@/components/ui/modal";
import { Field, FormGrid, TextInput, TextArea, Select, Checkbox } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { createVendor, sendDDQ } from "./actions";

const ATTESTATIONS = ["SOC2", "ISO27001", "ISO27017", "PCI_DSS", "HIPAA", "IRAP", "FEDRAMP"];

export default function VendorsActions() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [ddqPending, startDdq] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const empty = {
    name: "",
    category: "saas",
    dataAccessLevel: "internal",
    riskScore: 30,
    attestations: [] as string[],
    contractExpires: "",
    notes: "",
  };
  const [form, setForm] = useState(empty);

  function toggle(a: string) {
    setForm((f) => ({
      ...f,
      attestations: f.attestations.includes(a) ? f.attestations.filter((x) => x !== a) : [...f.attestations, a],
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createVendor({
          name: form.name,
          category: form.category,
          dataAccessLevel: form.dataAccessLevel,
          riskScore: Number(form.riskScore),
          attestations: form.attestations,
          contractExpires: form.contractExpires || null,
          notes: form.notes || null,
        });
        toast("Vendor onboarded", "success");
        setOpen(false);
        setForm(empty);
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to onboard vendor", "error");
      }
    });
  }

  function ddq() {
    startDdq(async () => {
      try {
        const { count } = await sendDDQ([]);
        if (count === 0) toast("No vendors due for DDQ", "info");
        else toast(`DDQ dispatched to ${count} vendor${count > 1 ? "s" : ""}`, "success");
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to send DDQ", "error");
      }
    });
  }

  return (
    <>
      <button type="button" className="btn" onClick={ddq} disabled={ddqPending}>
        {ddqPending ? "Sending…" : "Send DDQ"}
      </button>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>+ Onboard vendor</button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Onboard vendor"
        description="Add a vendor to the third-party register. An initial assessment is scheduled automatically (one year)."
        size="lg"
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
            <button type="submit" form="vendor-form" className="btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Onboard vendor"}
            </button>
          </>
        }
      >
        <form id="vendor-form" onSubmit={submit} className="space-y-4">
          <Field label="Vendor name">
            <TextInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Datadog Inc." />
          </Field>
          <FormGrid cols={3}>
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="saas">SaaS</option>
                <option value="hosting">Hosting</option>
                <option value="payments">Payments</option>
                <option value="support">Support</option>
                <option value="software">Software</option>
              </Select>
            </Field>
            <Field label="Data access level">
              <Select value={form.dataAccessLevel} onChange={(e) => setForm({ ...form, dataAccessLevel: e.target.value })}>
                <option value="none">None</option>
                <option value="internal">Internal</option>
                <option value="pii">PII</option>
                <option value="restricted">Restricted</option>
              </Select>
            </Field>
            <Field label="Initial risk score (0-100)">
              <TextInput
                type="number"
                min={0}
                max={100}
                value={form.riskScore}
                onChange={(e) => setForm({ ...form, riskScore: Number(e.target.value) })}
              />
            </Field>
          </FormGrid>
          <Field label="Contract expiry">
            <TextInput type="date" value={form.contractExpires} onChange={(e) => setForm({ ...form, contractExpires: e.target.value })} />
          </Field>
          <Field label="Attestations">
            <div className="flex flex-wrap gap-2 mt-1">
              {ATTESTATIONS.map((a) => (
                <Checkbox key={a} label={a} checked={form.attestations.includes(a)} onChange={() => toggle(a)} />
              ))}
            </div>
          </Field>
          <Field label="Notes">
            <TextArea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </form>
      </Modal>
    </>
  );
}
