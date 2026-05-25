"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Modal from "@/components/ui/modal";
import { Field, FormGrid, TextInput, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { downloadCSV, toCSV } from "@/lib/csv";
import { scheduleReview } from "./actions";

interface UserOption { id: string; name: string }
interface UserRow {
  email: string;
  name: string;
  role: string;
  department: string | null;
  mfaEnabled: boolean;
  privileged: boolean;
  dormant: boolean;
  lastLoginAt: Date | string | null;
}

export default function IAMActions({ users, userRows }: { users: UserOption[]; userRows: UserRow[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const empty = {
    scope: "production",
    reviewerId: users[0]?.id ?? "",
    scheduledFor: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  };
  const [form, setForm] = useState(empty);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await scheduleReview(form);
        toast("Access review scheduled", "success");
        setOpen(false);
        setForm(empty);
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to schedule review", "error");
      }
    });
  }

  function exportAudit() {
    const csv = toCSV(userRows, [
      { header: "Name", value: (u) => u.name },
      { header: "Email", value: (u) => u.email },
      { header: "Role", value: (u) => u.role },
      { header: "Department", value: (u) => u.department ?? "" },
      { header: "MFA", value: (u) => (u.mfaEnabled ? "yes" : "no") },
      { header: "Privileged", value: (u) => (u.privileged ? "yes" : "no") },
      { header: "Dormant", value: (u) => (u.dormant ? "yes" : "no") },
      { header: "Last login", value: (u) => u.lastLoginAt ?? "" },
    ]);
    downloadCSV(`user-audit-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast(`User audit exported (${userRows.length} users)`, "success");
  }

  return (
    <>
      <button type="button" className="btn" onClick={exportAudit}>Export user audit</button>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>+ Schedule review</button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Schedule access review"
        description="Quarterly access reviews are required by APRA CPS 234 and ISO 27001 (A.9). Pick a scope and reviewer."
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
            <button type="submit" form="review-form" className="btn-primary" disabled={pending}>
              {pending ? "Scheduling…" : "Schedule review"}
            </button>
          </>
        }
      >
        <form id="review-form" onSubmit={submit} className="space-y-4">
          <Field label="Scope">
            <Select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })}>
              <option value="production">Production</option>
              <option value="admin">Admin</option>
              <option value="vendor">Vendor</option>
              <option value="prod_db">Production database</option>
              <option value="prod_aws">Production AWS</option>
              <option value="privileged">Privileged accounts</option>
            </Select>
          </Field>
          <FormGrid cols={2}>
            <Field label="Reviewer">
              <Select required value={form.reviewerId} onChange={(e) => setForm({ ...form, reviewerId: e.target.value })}>
                <option value="">— select reviewer —</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </Select>
            </Field>
            <Field label="Scheduled for">
              <TextInput type="date" required value={form.scheduledFor} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} />
            </Field>
          </FormGrid>
        </form>
      </Modal>
    </>
  );
}
