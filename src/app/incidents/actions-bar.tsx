"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Modal from "@/components/ui/modal";
import { Field, FormGrid, TextInput, TextArea, Select, Checkbox } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { createIncident } from "./actions";

interface UserOption {
  id: string;
  name: string;
}

export default function IncidentsActions({ users }: { users: UserOption[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "high",
    detectionSource: "siem",
    ndbApplicable: false,
    sociReportable: false,
    apraReportable: false,
    piiAffected: false,
    recordsAffected: "",
    assigneeId: "",
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const result = await createIncident({
          title: form.title,
          description: form.description,
          severity: form.severity,
          detectionSource: form.detectionSource,
          ndbApplicable: form.ndbApplicable,
          sociReportable: form.sociReportable,
          apraReportable: form.apraReportable,
          piiAffected: form.piiAffected,
          recordsAffected: form.recordsAffected ? Number(form.recordsAffected) : null,
          assigneeId: form.assigneeId || null,
        });
        toast(`Incident ${result.ref} logged`, "success");
        setOpen(false);
        setForm({
          title: "",
          description: "",
          severity: "high",
          detectionSource: "siem",
          ndbApplicable: false,
          sociReportable: false,
          apraReportable: false,
          piiAffected: false,
          recordsAffected: "",
          assigneeId: "",
        });
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to log incident", "error");
      }
    });
  }

  return (
    <>
      <button type="button" className="btn" onClick={() => router.push("/incidents/runbook")}>
        IR runbook
      </button>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>
        + Log incident
      </button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Log incident"
        description="Open a new incident ticket. Regulatory flags determine NDB/SOCI/APRA notification clocks."
        size="lg"
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </button>
            <button type="submit" form="incident-form" className="btn-primary" disabled={pending}>
              {pending ? "Logging…" : "Log incident"}
            </button>
          </>
        }
      >
        <form id="incident-form" onSubmit={submit} className="space-y-4">
          <Field label="Title">
            <TextInput
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Suspicious privileged access from new IP"
            />
          </Field>
          <Field label="Description">
            <TextArea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What was detected, what is the current understanding?"
            />
          </Field>
          <FormGrid cols={3}>
            <Field label="Severity">
              <Select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </Field>
            <Field label="Detection source">
              <Select value={form.detectionSource} onChange={(e) => setForm({ ...form, detectionSource: e.target.value })}>
                <option value="siem">SIEM</option>
                <option value="alert">Alert</option>
                <option value="user_report">User report</option>
                <option value="vendor">Vendor</option>
                <option value="audit">Audit</option>
              </Select>
            </Field>
            <Field label="Records affected (optional)">
              <TextInput
                type="number"
                min={0}
                value={form.recordsAffected}
                onChange={(e) => setForm({ ...form, recordsAffected: e.target.value })}
                placeholder="0"
              />
            </Field>
          </FormGrid>
          <Field label="Assignee">
            <Select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Regulatory flags">
            <div className="grid grid-cols-2 gap-2 mt-1">
              <Checkbox
                label="PII affected"
                checked={form.piiAffected}
                onChange={(e) => setForm({ ...form, piiAffected: e.target.checked })}
              />
              <Checkbox
                label="NDB applicable (Privacy Act)"
                checked={form.ndbApplicable}
                onChange={(e) => setForm({ ...form, ndbApplicable: e.target.checked })}
              />
              <Checkbox
                label="SOCI reportable"
                checked={form.sociReportable}
                onChange={(e) => setForm({ ...form, sociReportable: e.target.checked })}
              />
              <Checkbox
                label="APRA CPS 234 reportable"
                checked={form.apraReportable}
                onChange={(e) => setForm({ ...form, apraReportable: e.target.checked })}
              />
            </div>
          </Field>
        </form>
      </Modal>
    </>
  );
}
