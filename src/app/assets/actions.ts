"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createAsset(data: {
  name: string;
  type: string;
  cloudProvider?: string | null;
  region?: string | null;
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
  ownerId?: string | null;
  notes?: string | null;
}) {
  if (!data.name.trim()) throw new Error("Name is required");
  await prisma.asset.create({
    data: {
      name: data.name.trim(),
      type: data.type,
      cloudProvider: data.cloudProvider || null,
      region: data.region || null,
      environment: data.environment,
      criticality: data.criticality,
      dataClassification: data.dataClassification,
      containsPII: data.containsPII,
      containsHealthData: data.containsHealthData,
      containsCardData: data.containsCardData,
      encryptionAtRest: data.encryptionAtRest,
      encryptionInTransit: data.encryptionInTransit,
      mfaEnforced: data.mfaEnforced,
      backupConfigured: data.backupConfigured,
      edrInstalled: data.edrInstalled,
      publicExposure: data.publicExposure,
      soci: data.soci,
      cdr: data.cdr,
      pci: data.pci,
      patchStatus: "unknown",
      ownerId: data.ownerId || null,
      notes: data.notes?.trim() || null,
    },
  });
  revalidatePath("/assets");
  revalidatePath("/");
}
