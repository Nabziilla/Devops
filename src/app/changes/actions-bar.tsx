"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Modal from "@/components/ui/modal";
import { Field, FormGrid, TextInput, TextArea, Select, Checkbox } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { downloadCSV, toCSV } from "@/lib/csv";
import { createChange } from "./actions";

interface UserOption { id: string; name: string }
interface AssetOption { id: string; name: string }
interface ChangeRow {
  ref: string;
  title: string;
  description: string;
  riskLevel: string;
  status: string;
  emergency: boolean;
  asset: { name: string } | null;
  approver: { name: string } | null;
  scheduledFor: Date | string | null;
  deployedAt: Date | string | null;
  rollbackAt: Date | string | null;
  createdAt: Date | string;
}

export default function ChangesActions({ users, assets, changes }: { users: UserOption[]; assets: AssetOption[]; changes: ChangeRow[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const empty = {
    title: "",
    description: "",
    riskLevel: "medium",
    emergency: false,
    assetId: "",
    approverId: "",
    scheduledFor: "",
  };
  const [form, setForm] = useState(empty);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createChange({
          ...form,
          assetId: form.assetId || null,
          approverId: form.approverId || null,
          scheduledFor: form.scheduledFor || null,
        });
        toast("Change raised", "success");
        setOpen(false);
        setForm(empty);
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to raise change", "error");
      }
    });
  }

  function exportLog() {
    const csv = toCSV(changes, [
      { header: "Ref", value: (c) => c.ref },
      { header: "Title", value: (c) => c.title },
      { header: "Description", value: (c) => c.description },
      { header: "Risk", value: (c) => c.riskLevel },
      { header: "Status", value: (c) => c.status },
      { header: "Emergency", value: (c) => (c.emergency ? "yes" : "no") },
      { header: "Asset", value: (c) => c.asset?.name ?? "" },
      { header: "Approver", value: (c) => c.approver?.name ?? "" },
      { header: "Scheduled", value: (c) => c.scheduledFor ?? "" },
      { header: "Deployed", value: (c) => c.deployedAt ?? "" },
      { header: "Rolled back", value: (c) => c.rollbackAt ?? "" },
      { header: "Created", value: (c) => c.createdAt },
    ]);
    downloadCSV(`change-log-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast(`Exported ${changes.length} changes`, "success");
  }

  return (
    <>
      <button type="button" className="btn" onClick={exportLog}>Export change log</button>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>+ Raise change</button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Raise change"
        description="Create a change request for production. Emergency changes still require an approver but bypass the standard lead time."
        size="lg"
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
            <button type="submit" form="change-form" className="btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Raise change"}
            </button>
          </>
        }
      >
        <form id="change-form" onSubmit={submit} className="space-y-4">
          <Field label="Title">
            <TextInput required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Rotate prod database root credentials" />
          </Field>
          <Field label="Description">
            <TextArea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Scope, rollback plan, validation steps" />
          </Field>
          <FormGrid cols={3}>
            <Field label="Risk level">
              <Select value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </Select>
            </Field>
            <Field label="Asset">
              <Select value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })}>
                <option value="">— none —</option>
                {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </Select>
            </Field>
            <Field label="Approver">
              <Select value={form.approverId} onChange={(e) => setForm({ ...form, approverId: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </Field>
          </FormGrid>
          <FormGrid cols={2}>
            <Field label="Scheduled for">
              <TextInput type="datetime-local" value={form.scheduledFor} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} />
            </Field>
            <Field label="Type">
              <div className="pt-2">
                <Checkbox label="Emergency change" checked={form.emergency} onChange={(e) => setForm({ ...form, emergency: e.target.checked })} />
              </div>
            </Field>
          </FormGrid>
        </form>
      </Modal>
    </>
  );
}
