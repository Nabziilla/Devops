"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Modal from "@/components/ui/modal";
import { Field, TextArea, Select } from "@/components/ui/form";
import { useToast } from "@/components/ui/toast";
import { importSbom, runScan } from "./actions";

interface AssetOption { id: string; name: string }

const SAMPLE_SBOM = `[
  { "name": "openssl", "version": "3.0.7", "cve": "CVE-2023-0286", "severity": "high", "cvssScore": 7.4 },
  { "name": "log4j-core", "version": "2.14.1", "cve": "CVE-2021-44228", "severity": "critical", "cvssScore": 10.0 },
  { "name": "curl", "version": "7.79.1", "cve": "CVE-2022-27776", "severity": "medium", "cvssScore": 4.3 }
]`;

export default function VulnerabilitiesActions({ assets }: { assets: AssetOption[] }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [scanPending, startScan] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const [form, setForm] = useState({
    assetId: assets[0]?.id ?? "",
    sbomJson: SAMPLE_SBOM,
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const components = JSON.parse(form.sbomJson);
        if (!Array.isArray(components)) throw new Error("SBOM must be a JSON array");
        const { created } = await importSbom({ assetId: form.assetId, components });
        toast(`Imported ${created} component${created === 1 ? "" : "s"}`, "success");
        setOpen(false);
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Invalid SBOM JSON", "error");
      }
    });
  }

  function scan() {
    startScan(async () => {
      try {
        const { scanned } = await runScan();
        toast(`Scan complete · ${scanned} open finding${scanned === 1 ? "" : "s"} refreshed`, "success");
        router.refresh();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Scan failed", "error");
      }
    });
  }

  return (
    <>
      <button type="button" className="btn" onClick={scan} disabled={scanPending}>
        {scanPending ? "Scanning…" : "Run scan"}
      </button>
      <button type="button" className="btn-primary" onClick={() => setOpen(true)}>Import SBOM</button>

      <Modal
        open={open}
        onClose={() => !pending && setOpen(false)}
        title="Import SBOM"
        description="Paste a software bill of materials (JSON array of components). Each entry creates a vulnerability finding with an SLA derived from severity."
        size="lg"
        footer={
          <>
            <button type="button" className="btn" onClick={() => setOpen(false)} disabled={pending}>Cancel</button>
            <button type="submit" form="sbom-form" className="btn-primary" disabled={pending}>
              {pending ? "Importing…" : "Import"}
            </button>
          </>
        }
      >
        <form id="sbom-form" onSubmit={submit} className="space-y-4">
          <Field label="Target asset">
            <Select required value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })}>
              {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          </Field>
          <Field
            label="SBOM JSON"
            hint='Array of components. Fields: name, version, cve, severity (critical/high/medium/low), cvssScore.'
          >
            <TextArea
              required
              rows={12}
              value={form.sbomJson}
              onChange={(e) => setForm({ ...form, sbomJson: e.target.value })}
              className="font-mono text-xs"
            />
          </Field>
        </form>
      </Modal>
    </>
  );
}
