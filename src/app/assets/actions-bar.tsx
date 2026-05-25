"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Modal from "@/components/ui/modal";
import { Field, FormGrid, TextInput, TextArea, Select, Checkbox } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { downloadCSV, toCSV } from "@/lib/csv";
import { createAsset } from "./actions";

interface UserOption { id: string; name: string }
interface AssetRow {
  name: string;
  type: string;
  cloudProvider: string | null;
  region: string | null;
  environment: string;
  criticality: string;
  dataClassification: string;
  containsPII: boolean;
  containsHealthData: boolean;
  containsCardData: boolean;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  mfaEnforced: boolean;
  backupConfigured: boolean;
  edrInstalled: boolean;
  publicExposure: boolean;
  soci: boolean;
  cdr: boolean;
  pci: boolean;
  patchStatus: string;
  lastPatchedAt: Date | string | null;
  owner: { name: string } | null;
}

export default function AssetsActions({ users, assets }: { users: UserOption[]; assets: AssetRow[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const empty = {
    name: "",
    type: "server",
    cloudProvider: "aws",
    region: "",
    environment: "prod",
    criticality: "medium",
    dataClassification: "internal",
    containsPII: false,
    containsHealthData: false,
    containsCardData: false,
    encryptionAtRest: true,
    encryptionInTransit: true,
    mfaEnforced: false,
    backupConfigured: false,
    edrInstalled: false,
    publicExposure: false,
    soci: false,
    cdr: false,
    pci: false,
    ownerId: "",
    notes: "",
  };
  const [form, setForm] = useState(empty);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await createAsset({
          ...form,
          cloudProvider: form.cloudProvider || null,
          region: form.region || null,
          ownerId: form.ownerId || null,
          notes: form.notes || null,
        });
        toast("Asset registered", "success");
        setOpen(false);
        setForm(empty);
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Failed to register asset", "error");
      }
    });
  }

  function exportCsv() {
    const csv = toCSV(assets, [
      { header: "Name", value: (a) => a.name },
      { header: "Type", value: (a) => a.type },
      { header: "Cloud", value: (a) => a.cloudProvider ?? "" },
      { header: "Region", value: (a) => a.region ?? "" },
      { header: "Environment", value: (a) => a.environment },
      { header: "Criticality", value: (a) => a.criticality },
      { header: "Classification", value: (a) => a.dataClassification },
      { header: "PII", value: (a) => (a.containsPII ? "yes" : "no") },
      { header: "Health data", value: (a) => (a.containsHealthData ? "yes" : "no") },
      { header: "Card data", value: (a) => (a.containsCardData ? "yes" : "no") },
      { header: "Encrypted at rest", value: (a) => (a.encryptionAtRest ? "yes" : "no") },
      { header: "TLS in transit", value: (a) => (a.encryptionInTransit ? "yes" : "no") },
      { header: "MFA", value: (a) => (a.mfaEnforced ? "yes" : "no") },
      { header: "Backup", value: (a) => (a.backupConfigured ? "yes" : "no") },
      { header: "EDR", value: (a) => (a.edrInstalled ? "yes" : "no") },
      { header: "Public exposure", value: (a) => (a.publicExposure ? "yes" : "no") },
      { header: "SOCI", value: (a) => (a.soci ? "yes" : "no") },
      { header: "CDR", value: (a) => (a.cdr ? "yes" : "no") },
      { header: "PCI", value: (a) => (a.pci ? "yes" : "no") },
      { header: "Patch status", value: (a) => a.patchStatus },
      { header: "Last patched", value: (a) => a.lastPatchedAt ?? "" },
      { header: "Owner", value: (a) => a.owner?.name ?? "" },
    ]);
    downloadCSV(`assets-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast(`Exported ${assets.length} assets`, "success");
  }

  const set = (patch: Partial<typeof empty>) => setForm({ ...form, ...patch });

  return (
    <>
      <button type="button" className="btn" onClick={exportCsv}>Export CSV</button>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>+ Register asset</button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Register asset"
        description="Add an asset to the inventory and tag its regulatory scope and security posture."
        size="lg"
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
            <button type="submit" form="asset-form" className="btn-primary" disabled={pending}>
              {pending ? "Saving…" : "Register asset"}
            </button>
          </>
        }
      >
        <form id="asset-form" onSubmit={submit} className="space-y-4">
          <Field label="Name">
            <TextInput required value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. prod-orders-db-01" />
          </Field>
          <FormGrid cols={3}>
            <Field label="Type">
              <Select value={form.type} onChange={(e) => set({ type: e.target.value })}>
                <option value="server">Server</option>
                <option value="database">Database</option>
                <option value="saas">SaaS</option>
                <option value="container">Container</option>
                <option value="app">Application</option>
                <option value="network">Network</option>
                <option value="endpoint">Endpoint</option>
                <option value="repo">Repository</option>
              </Select>
            </Field>
            <Field label="Cloud provider">
              <Select value={form.cloudProvider} onChange={(e) => set({ cloudProvider: e.target.value })}>
                <option value="aws">AWS</option>
                <option value="azure">Azure</option>
                <option value="gcp">GCP</option>
                <option value="onprem">On-prem</option>
                <option value="saas">SaaS</option>
                <option value="">—</option>
              </Select>
            </Field>
            <Field label="Region">
              <TextInput value={form.region} onChange={(e) => set({ region: e.target.value })} placeholder="ap-southeast-2" />
            </Field>
          </FormGrid>
          <FormGrid cols={3}>
            <Field label="Environment">
              <Select value={form.environment} onChange={(e) => set({ environment: e.target.value })}>
                <option value="prod">Production</option>
                <option value="staging">Staging</option>
                <option value="dev">Development</option>
              </Select>
            </Field>
            <Field label="Criticality">
              <Select value={form.criticality} onChange={(e) => set({ criticality: e.target.value })}>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </Select>
            </Field>
            <Field label="Data classification">
              <Select value={form.dataClassification} onChange={(e) => set({ dataClassification: e.target.value })}>
                <option value="public">Public</option>
                <option value="internal">Internal</option>
                <option value="confidential">Confidential</option>
                <option value="restricted">Restricted</option>
              </Select>
            </Field>
          </FormGrid>
          <Field label="Owner">
            <Select value={form.ownerId} onChange={(e) => set({ ownerId: e.target.value })}>
              <option value="">Unassigned</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </Select>
          </Field>
          <Field label="Data sensitivity">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Checkbox label="Contains PII" checked={form.containsPII} onChange={(e) => set({ containsPII: e.target.checked })} />
              <Checkbox label="Health data" checked={form.containsHealthData} onChange={(e) => set({ containsHealthData: e.target.checked })} />
              <Checkbox label="Card data" checked={form.containsCardData} onChange={(e) => set({ containsCardData: e.target.checked })} />
            </div>
          </Field>
          <Field label="Regulatory scope">
            <div className="grid grid-cols-3 gap-2">
              <Checkbox label="SOCI" checked={form.soci} onChange={(e) => set({ soci: e.target.checked })} />
              <Checkbox label="CDR" checked={form.cdr} onChange={(e) => set({ cdr: e.target.checked })} />
              <Checkbox label="PCI" checked={form.pci} onChange={(e) => set({ pci: e.target.checked })} />
            </div>
          </Field>
          <Field label="Security controls">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Checkbox label="Encryption at rest" checked={form.encryptionAtRest} onChange={(e) => set({ encryptionAtRest: e.target.checked })} />
              <Checkbox label="TLS in transit" checked={form.encryptionInTransit} onChange={(e) => set({ encryptionInTransit: e.target.checked })} />
              <Checkbox label="MFA enforced" checked={form.mfaEnforced} onChange={(e) => set({ mfaEnforced: e.target.checked })} />
              <Checkbox label="Backups configured" checked={form.backupConfigured} onChange={(e) => set({ backupConfigured: e.target.checked })} />
              <Checkbox label="EDR installed" checked={form.edrInstalled} onChange={(e) => set({ edrInstalled: e.target.checked })} />
              <Checkbox label="Public exposure" checked={form.publicExposure} onChange={(e) => set({ publicExposure: e.target.checked })} />
            </div>
          </Field>
          <Field label="Notes">
            <TextArea value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Owner team, links, runbooks" />
          </Field>
        </form>
      </Modal>
    </>
  );
}
