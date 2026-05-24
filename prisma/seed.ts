import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const daysFromNow = (d: number) => new Date(Date.now() + d * 86400_000);
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000);

async function main() {
  console.log("Clearing existing data…");
  await prisma.auditLog.deleteMany();
  await prisma.incidentEvent.deleteMany();
  await prisma.incidentAsset.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.vulnerability.deleteMany();
  await prisma.assetControl.deleteMany();
  await prisma.change.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.controlException.deleteMany();
  await prisma.control.deleteMany();
  await prisma.framework.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.accessReview.deleteMany();
  await prisma.user.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.policy.deleteMany();

  // ---------------- Users ----------------
  console.log("Seeding users…");
  const users = await Promise.all(
    [
      { email: "nabil.sabih@hapana.com", name: "Nabil Sabih", role: "admin", department: "Platform Engineering", mfaEnabled: true, privileged: true },
      { email: "emma.chen@example.com.au", name: "Emma Chen", role: "engineer", department: "Platform Engineering", mfaEnabled: true, privileged: true },
      { email: "michael.osullivan@example.com.au", name: "Michael O'Sullivan", role: "engineer", department: "DevSecOps", mfaEnabled: true, privileged: true },
      { email: "priya.iyer@example.com.au", name: "Priya Iyer", role: "engineer", department: "Cloud Operations", mfaEnabled: true, privileged: false },
      { email: "james.tanaka@example.com.au", name: "James Tanaka", role: "engineer", department: "Engineering", mfaEnabled: false, privileged: false },
      { email: "sarah.nguyen@example.com.au", name: "Sarah Nguyen", role: "auditor", department: "Risk & Compliance", mfaEnabled: true, privileged: false },
      { email: "tom.fitzgerald@example.com.au", name: "Tom Fitzgerald", role: "executive", department: "Executive", mfaEnabled: true, privileged: false },
      { email: "alex.kowalski@example.com.au", name: "Alex Kowalski", role: "engineer", department: "Data Engineering", mfaEnabled: true, privileged: false },
      { email: "olivia.murray@example.com.au", name: "Olivia Murray", role: "engineer", department: "Site Reliability", mfaEnabled: true, privileged: true },
      { email: "former.contractor@example.com.au", name: "L. Bennett", role: "engineer", department: "Contractor", mfaEnabled: false, privileged: false, dormant: true },
      { email: "raj.patel@example.com.au", name: "Raj Patel", role: "engineer", department: "Security", mfaEnabled: true, privileged: true },
      { email: "kate.smith@example.com.au", name: "Kate Smith", role: "engineer", department: "Engineering", mfaEnabled: true, privileged: false },
    ].map((u) =>
      prisma.user.create({
        data: {
          ...u,
          lastLoginAt: u.dormant ? daysFromNow(-120) : daysFromNow(-Math.floor(Math.random() * 5)),
        },
      })
    )
  );
  const userByEmail = Object.fromEntries(users.map((u) => [u.email, u]));

  // ---------------- Frameworks ----------------
  console.log("Seeding frameworks…");
  const frameworks = await Promise.all(
    [
      { code: "PRIVACY_ACT", name: "Privacy Act 1988 (Cth) — APPs", jurisdiction: "AU", regulator: "OAIC", mandatory: true, description: "Australian Privacy Principles (APPs). Applies to entities with turnover > $3M, health data handlers, government contracts." },
      { code: "NDB", name: "Notifiable Data Breaches Scheme", jurisdiction: "AU", regulator: "OAIC", mandatory: true, description: "Mandatory notification of eligible data breaches likely to cause serious harm." },
      { code: "SOCI", name: "Security of Critical Infrastructure Act 2018", jurisdiction: "AU", regulator: "Department of Home Affairs", mandatory: true, description: "Risk Management Program and incident reporting for critical infrastructure (12h/72h)." },
      { code: "APRA_CPS234", name: "APRA Prudential Standard CPS 234", jurisdiction: "AU", regulator: "APRA", mandatory: false, description: "Information security capability commensurate with size and extent of threats. Mandatory for APRA-regulated entities." },
      { code: "ESSENTIAL8", name: "ACSC Essential Eight", jurisdiction: "AU", regulator: "ACSC", mandatory: false, description: "Eight mitigation strategies to protect against cyber threats. Required for many AU gov contracts." },
      { code: "CDR", name: "Consumer Data Right", jurisdiction: "AU", regulator: "ACCC / OAIC", mandatory: false, description: "Open banking / energy / telco data sharing with strict API, consent and security controls." },
      { code: "PCI_DSS", name: "PCI DSS v4.0", jurisdiction: "INTL", regulator: "PCI SSC", mandatory: false, description: "Cardholder data protection." },
      { code: "ISO27001", name: "ISO/IEC 27001:2022", jurisdiction: "INTL", regulator: "ISO", mandatory: false, description: "Information security management system." },
      { code: "SOC2", name: "AICPA SOC 2 Type II", jurisdiction: "INTL", regulator: "AICPA", mandatory: false, description: "Trust services criteria — security, availability, confidentiality, processing integrity, privacy." },
      { code: "NIST_CSF", name: "NIST Cybersecurity Framework 2.0", jurisdiction: "INTL", regulator: "NIST", mandatory: false, description: "Identify, Protect, Detect, Respond, Recover, Govern." },
    ].map((f) => prisma.framework.create({ data: f }))
  );
  const fwByCode = Object.fromEntries(frameworks.map((f) => [f.code, f]));

  // ---------------- Controls ----------------
  console.log("Seeding controls…");
  type CtrlSeed = {
    code: string; title: string; description: string; category: string; framework: string;
    status: string; maturity: number; validationFreq: string; owner?: string; notes?: string;
  };
  const controlSeeds: CtrlSeed[] = [
    // Privacy Act / APPs
    { code: "APP-1.1", title: "Open and transparent management of personal information", description: "Maintain a clearly expressed and up-to-date privacy policy.", category: "PRIVACY", framework: "PRIVACY_ACT", status: "compliant", maturity: 4, validationFreq: "annual", owner: "sarah.nguyen@example.com.au" },
    { code: "APP-3", title: "Collection of solicited personal information", description: "Only collect personal information reasonably necessary for functions.", category: "PRIVACY", framework: "PRIVACY_ACT", status: "compliant", maturity: 4, validationFreq: "quarterly", owner: "sarah.nguyen@example.com.au" },
    { code: "APP-8", title: "Cross-border disclosure of personal information", description: "Reasonable steps to ensure overseas recipients do not breach APPs.", category: "PRIVACY", framework: "PRIVACY_ACT", status: "partial", maturity: 3, validationFreq: "quarterly", owner: "sarah.nguyen@example.com.au", notes: "Pending review of AWS regions used by analytics team" },
    { code: "APP-11", title: "Security of personal information", description: "Reasonable steps to protect PII from misuse, loss, unauthorised access.", category: "PRIVACY", framework: "PRIVACY_ACT", status: "compliant", maturity: 4, validationFreq: "quarterly", owner: "michael.osullivan@example.com.au" },
    { code: "APP-12", title: "Access to personal information", description: "Allow individuals to access personal information held about them.", category: "PRIVACY", framework: "PRIVACY_ACT", status: "compliant", maturity: 3, validationFreq: "annual", owner: "sarah.nguyen@example.com.au" },
    { code: "APP-13", title: "Correction of personal information", description: "Correct inaccurate or out-of-date personal information.", category: "PRIVACY", framework: "PRIVACY_ACT", status: "compliant", maturity: 3, validationFreq: "annual", owner: "sarah.nguyen@example.com.au" },

    // NDB
    { code: "NDB-DETECT", title: "Breach detection capability", description: "Logging, alerting, and triage to identify eligible data breaches.", category: "INCIDENT", framework: "NDB", status: "compliant", maturity: 4, validationFreq: "quarterly", owner: "raj.patel@example.com.au" },
    { code: "NDB-ASSESS", title: "Breach assessment within 30 days", description: "Documented process to assess whether breach is likely to cause serious harm.", category: "INCIDENT", framework: "NDB", status: "compliant", maturity: 3, validationFreq: "annual", owner: "sarah.nguyen@example.com.au" },
    { code: "NDB-NOTIFY", title: "Mandatory notification workflow", description: "OAIC and affected-individual notification workflow with template statements.", category: "INCIDENT", framework: "NDB", status: "partial", maturity: 3, validationFreq: "annual", owner: "sarah.nguyen@example.com.au", notes: "Statement template last reviewed 14 months ago" },

    // SOCI
    { code: "SOCI-RMP", title: "Risk Management Program (RMP)", description: "Board-approved Risk Management Program covering cyber, personnel, physical and supply chain hazards.", category: "GOVERNANCE", framework: "SOCI", status: "compliant", maturity: 4, validationFreq: "annual", owner: "tom.fitzgerald@example.com.au" },
    { code: "SOCI-12H", title: "12-hour critical incident notification", description: "Process to report critical cyber incidents to ASD within 12 hours.", category: "INCIDENT", framework: "SOCI", status: "compliant", maturity: 4, validationFreq: "quarterly", owner: "raj.patel@example.com.au" },
    { code: "SOCI-72H", title: "72-hour other cyber incident notification", description: "Process to report other reportable cyber incidents to ASD within 72 hours.", category: "INCIDENT", framework: "SOCI", status: "compliant", maturity: 4, validationFreq: "quarterly", owner: "raj.patel@example.com.au" },
    { code: "SOCI-SC", title: "Supply chain hazard management", description: "Identification and mitigation of supply chain risks for critical infrastructure assets.", category: "SUPPLY_CHAIN", framework: "SOCI", status: "partial", maturity: 2, validationFreq: "quarterly", owner: "michael.osullivan@example.com.au" },

    // APRA CPS 234
    { code: "CPS234-1", title: "Information security capability", description: "Capability commensurate with size and extent of threats.", category: "GOVERNANCE", framework: "APRA_CPS234", status: "compliant", maturity: 4, validationFreq: "annual", owner: "tom.fitzgerald@example.com.au" },
    { code: "CPS234-2", title: "Third-party information security", description: "Assess third parties that manage information assets.", category: "SUPPLY_CHAIN", framework: "APRA_CPS234", status: "partial", maturity: 3, validationFreq: "quarterly", owner: "sarah.nguyen@example.com.au" },
    { code: "CPS234-3", title: "Control testing programme", description: "Systematic testing of information security controls.", category: "LOGGING", framework: "APRA_CPS234", status: "compliant", maturity: 3, validationFreq: "quarterly", owner: "raj.patel@example.com.au" },
    { code: "CPS234-4", title: "Material incident notification (72h)", description: "Notify APRA of material security incidents within 72 hours.", category: "INCIDENT", framework: "APRA_CPS234", status: "compliant", maturity: 4, validationFreq: "annual", owner: "raj.patel@example.com.au" },

    // Essential Eight
    { code: "E8-1", title: "Application control", description: "Prevent execution of unapproved applications.", category: "ENDPOINT", framework: "ESSENTIAL8", status: "partial", maturity: 2, validationFreq: "quarterly", owner: "olivia.murray@example.com.au" },
    { code: "E8-2", title: "Patch applications", description: "Apply patches to internet-facing apps within 48h for critical, 1 month for others.", category: "PATCH", framework: "ESSENTIAL8", status: "partial", maturity: 2, validationFreq: "monthly", owner: "olivia.murray@example.com.au" },
    { code: "E8-3", title: "Configure MS Office macros", description: "Block macros from the internet; only allow vetted macros.", category: "ENDPOINT", framework: "ESSENTIAL8", status: "compliant", maturity: 3, validationFreq: "quarterly", owner: "olivia.murray@example.com.au" },
    { code: "E8-4", title: "User application hardening", description: "Configure web browsers and PDF readers to block risky features.", category: "ENDPOINT", framework: "ESSENTIAL8", status: "compliant", maturity: 3, validationFreq: "quarterly", owner: "olivia.murray@example.com.au" },
    { code: "E8-5", title: "Restrict administrative privileges", description: "Limit and review admin privileges based on duties.", category: "IAM", framework: "ESSENTIAL8", status: "compliant", maturity: 3, validationFreq: "quarterly", owner: "michael.osullivan@example.com.au" },
    { code: "E8-6", title: "Patch operating systems", description: "Apply OS patches within 48h critical / 1 month others.", category: "PATCH", framework: "ESSENTIAL8", status: "non_compliant", maturity: 1, validationFreq: "monthly", owner: "olivia.murray@example.com.au", notes: "Patch SLA breach in stage-east env; 14 hosts >30d behind" },
    { code: "E8-7", title: "Multi-factor authentication", description: "MFA for internet-facing services, privileged accounts and remote access.", category: "IAM", framework: "ESSENTIAL8", status: "compliant", maturity: 4, validationFreq: "monthly", owner: "michael.osullivan@example.com.au" },
    { code: "E8-8", title: "Regular backups", description: "Backups of important data, software, and config. Tested restores. Immutable.", category: "BACKUP", framework: "ESSENTIAL8", status: "compliant", maturity: 3, validationFreq: "quarterly", owner: "priya.iyer@example.com.au" },

    // CDR
    { code: "CDR-API", title: "Accredited data recipient API security", description: "TLS, MTLS, JWT, FAPI-RW profile, JWKS rotation.", category: "API", framework: "CDR", status: "compliant", maturity: 4, validationFreq: "quarterly", owner: "emma.chen@example.com.au" },
    { code: "CDR-CONSENT", title: "Consumer consent management", description: "Granular consent, expiry, revocation, dashboard.", category: "PRIVACY", framework: "CDR", status: "compliant", maturity: 4, validationFreq: "quarterly", owner: "emma.chen@example.com.au" },

    // PCI DSS
    { code: "PCI-1", title: "Network segmentation for CDE", description: "Cardholder Data Environment isolated by firewall and VPC peering rules.", category: "NETWORK", framework: "PCI_DSS", status: "compliant", maturity: 4, validationFreq: "quarterly", owner: "priya.iyer@example.com.au" },
    { code: "PCI-3", title: "PAN encryption", description: "PAN encrypted at rest and in transit, key rotation annually.", category: "ENCRYPTION", framework: "PCI_DSS", status: "compliant", maturity: 4, validationFreq: "annual", owner: "emma.chen@example.com.au" },
    { code: "PCI-10", title: "Logging & audit trails", description: "All CDE access logged, log integrity preserved 12 months.", category: "LOGGING", framework: "PCI_DSS", status: "compliant", maturity: 4, validationFreq: "quarterly", owner: "raj.patel@example.com.au" },
    { code: "PCI-11", title: "Quarterly ASV scans + annual pen test", description: "External ASV scans quarterly, internal & external pen test annually.", category: "TESTING", framework: "PCI_DSS", status: "partial", maturity: 3, validationFreq: "quarterly", owner: "raj.patel@example.com.au", notes: "Q2 pen test report pending remediation sign-off" },

    // ISO 27001
    { code: "ISO-A.5.1", title: "Policies for information security", description: "Approved set of information security policies, communicated to staff.", category: "GOVERNANCE", framework: "ISO27001", status: "compliant", maturity: 3, validationFreq: "annual", owner: "tom.fitzgerald@example.com.au" },
    { code: "ISO-A.5.7", title: "Threat intelligence", description: "Collect and analyse threat intelligence relevant to environment.", category: "DETECTION", framework: "ISO27001", status: "partial", maturity: 2, validationFreq: "quarterly", owner: "raj.patel@example.com.au" },
    { code: "ISO-A.8.16", title: "Monitoring activities", description: "Monitor networks, systems and applications for anomalies.", category: "LOGGING", framework: "ISO27001", status: "compliant", maturity: 4, validationFreq: "quarterly", owner: "raj.patel@example.com.au" },

    // SOC 2
    { code: "SOC2-CC6.1", title: "Logical access controls", description: "Restrict logical access via authentication and authorisation.", category: "IAM", framework: "SOC2", status: "compliant", maturity: 4, validationFreq: "quarterly", owner: "michael.osullivan@example.com.au" },
    { code: "SOC2-CC7.2", title: "Anomalies and security events", description: "Detection and response to security events.", category: "DETECTION", framework: "SOC2", status: "compliant", maturity: 4, validationFreq: "quarterly", owner: "raj.patel@example.com.au" },
    { code: "SOC2-CC8.1", title: "Change management", description: "Authorised changes, design, development, configuration.", category: "CHANGE", framework: "SOC2", status: "compliant", maturity: 4, validationFreq: "quarterly", owner: "emma.chen@example.com.au" },

    // NIST CSF
    { code: "NIST-ID.AM", title: "Asset management", description: "Inventory of physical devices, software, and information assets.", category: "ASSET", framework: "NIST_CSF", status: "compliant", maturity: 3, validationFreq: "quarterly", owner: "olivia.murray@example.com.au" },
    { code: "NIST-PR.DS", title: "Data security", description: "Information managed consistent with risk strategy.", category: "ENCRYPTION", framework: "NIST_CSF", status: "compliant", maturity: 3, validationFreq: "quarterly", owner: "emma.chen@example.com.au" },
    { code: "NIST-RS.MI", title: "Mitigation", description: "Activities performed to prevent expansion of an event.", category: "INCIDENT", framework: "NIST_CSF", status: "partial", maturity: 3, validationFreq: "annual", owner: "raj.patel@example.com.au" },
  ];

  const controls = await Promise.all(
    controlSeeds.map((c) => {
      const fw = fwByCode[c.framework];
      const owner = c.owner ? userByEmail[c.owner] : undefined;
      return prisma.control.create({
        data: {
          code: c.code,
          title: c.title,
          description: c.description,
          category: c.category,
          frameworkId: fw.id,
          ownerId: owner?.id,
          status: c.status,
          maturity: c.maturity,
          validationFreq: c.validationFreq,
          lastValidated: daysFromNow(-Math.floor(Math.random() * 60) - 10),
          nextDue: daysFromNow(c.code === "E8-6" ? -10 : c.code === "E8-2" ? -3 : Math.floor(Math.random() * 90) + 5),
          notes: c.notes,
        },
      });
    })
  );
  const ctrlByCode = Object.fromEntries(controls.map((c) => [c.code, c]));

  // ---------------- Control exceptions ----------------
  await prisma.controlException.create({
    data: {
      controlId: ctrlByCode["E8-6"].id,
      reason: "Legacy Windows Server 2016 hosts in stage-east; replacement Q3.",
      compensating: "Network isolation, EDR, weekly manual review",
      approver: "Tom Fitzgerald (CTO)",
      expiresAt: daysFromNow(60),
    },
  });

  // ---------------- Assets ----------------
  console.log("Seeding assets…");
  type AssetSeed = {
    name: string; type: string; cloud?: string; region?: string; env: string; criticality: string;
    classification: string; pii?: boolean; health?: boolean; card?: boolean; encR?: boolean; encT?: boolean;
    backup?: boolean; backupEnc?: boolean; xborder?: boolean; pub?: boolean; mfa?: boolean;
    edr?: boolean; patch: string; soci?: boolean; cdr?: boolean; pci?: boolean; owner?: string;
    retention?: number;
  };
  const assetSeeds: AssetSeed[] = [
    { name: "prod-api-cluster", type: "container", cloud: "aws", region: "ap-southeast-2", env: "prod", criticality: "critical", classification: "confidential", pii: true, encR: true, encT: true, backup: true, backupEnc: true, mfa: true, edr: true, patch: "current", owner: "emma.chen@example.com.au", retention: 365 },
    { name: "prod-customer-db", type: "database", cloud: "aws", region: "ap-southeast-2", env: "prod", criticality: "critical", classification: "restricted", pii: true, encR: true, encT: true, backup: true, backupEnc: true, mfa: true, edr: false, patch: "current", owner: "priya.iyer@example.com.au", retention: 2555 },
    { name: "prod-payments-svc", type: "container", cloud: "aws", region: "ap-southeast-2", env: "prod", criticality: "critical", classification: "restricted", card: true, encR: true, encT: true, backup: true, backupEnc: true, mfa: true, edr: true, patch: "current", pci: true, owner: "emma.chen@example.com.au", retention: 2555 },
    { name: "cdr-api-gateway", type: "app", cloud: "aws", region: "ap-southeast-2", env: "prod", criticality: "critical", classification: "restricted", pii: true, encR: true, encT: true, backup: true, backupEnc: true, mfa: true, edr: true, patch: "current", cdr: true, owner: "emma.chen@example.com.au", retention: 2555 },
    { name: "soci-energy-control", type: "app", cloud: "azure", region: "australiaeast", env: "prod", criticality: "critical", classification: "restricted", encR: true, encT: true, backup: true, backupEnc: true, mfa: true, edr: true, patch: "current", soci: true, owner: "olivia.murray@example.com.au", retention: 2555 },
    { name: "stage-api-cluster", type: "container", cloud: "aws", region: "ap-southeast-2", env: "staging", criticality: "medium", classification: "internal", encR: true, encT: true, backup: true, backupEnc: true, mfa: true, edr: false, patch: "lagging", owner: "emma.chen@example.com.au", retention: 90 },
    { name: "stage-east-legacy-01", type: "server", cloud: "aws", region: "ap-southeast-2", env: "staging", criticality: "medium", classification: "internal", encR: true, encT: true, backup: true, mfa: false, edr: true, patch: "critical", owner: "olivia.murray@example.com.au", retention: 90 },
    { name: "data-warehouse", type: "database", cloud: "gcp", region: "australia-southeast1", env: "prod", criticality: "high", classification: "confidential", pii: true, encR: true, encT: true, backup: true, backupEnc: true, mfa: true, edr: false, patch: "current", xborder: false, owner: "alex.kowalski@example.com.au", retention: 1825 },
    { name: "analytics-replica-uswest", type: "database", cloud: "aws", region: "us-west-2", env: "prod", criticality: "high", classification: "confidential", pii: true, encR: true, encT: true, backup: true, backupEnc: true, mfa: true, edr: false, patch: "current", xborder: true, owner: "alex.kowalski@example.com.au", retention: 365 },
    { name: "marketing-site", type: "app", cloud: "aws", region: "ap-southeast-2", env: "prod", criticality: "medium", classification: "public", encR: false, encT: true, backup: true, mfa: true, edr: false, patch: "current", pub: true, owner: "james.tanaka@example.com.au" },
    { name: "internal-jenkins", type: "server", cloud: "aws", region: "ap-southeast-2", env: "prod", criticality: "high", classification: "internal", encR: true, encT: true, backup: false, mfa: true, edr: true, patch: "lagging", owner: "michael.osullivan@example.com.au" },
    { name: "gitlab-source-repo", type: "saas", cloud: "saas", env: "prod", criticality: "high", classification: "confidential", encR: true, encT: true, backup: true, backupEnc: true, mfa: true, edr: false, patch: "current", owner: "michael.osullivan@example.com.au" },
    { name: "clinical-records-svc", type: "app", cloud: "azure", region: "australiaeast", env: "prod", criticality: "critical", classification: "restricted", pii: true, health: true, encR: true, encT: true, backup: true, backupEnc: true, mfa: true, edr: true, patch: "current", owner: "priya.iyer@example.com.au", retention: 2555 },
    { name: "support-helpdesk-saas", type: "saas", cloud: "saas", env: "prod", criticality: "medium", classification: "confidential", pii: true, encR: true, encT: true, backup: true, mfa: true, edr: false, patch: "current", xborder: true, owner: "sarah.nguyen@example.com.au" },
    { name: "k8s-prod-cluster", type: "container", cloud: "aws", region: "ap-southeast-2", env: "prod", criticality: "critical", classification: "confidential", encR: true, encT: true, backup: true, backupEnc: true, mfa: true, edr: true, patch: "current", owner: "olivia.murray@example.com.au" },
    { name: "old-wiki-onprem", type: "server", cloud: "onprem", env: "prod", criticality: "low", classification: "internal", encR: false, encT: false, backup: false, mfa: false, edr: false, patch: "unknown", owner: "james.tanaka@example.com.au" },
    { name: "dev-sandbox-vpc", type: "network", cloud: "aws", region: "ap-southeast-2", env: "dev", criticality: "low", classification: "internal", encR: true, encT: true, mfa: true, edr: false, patch: "current", owner: "kate.smith@example.com.au" },
  ];

  const assets = await Promise.all(
    assetSeeds.map((a) =>
      prisma.asset.create({
        data: {
          name: a.name,
          type: a.type,
          cloudProvider: a.cloud,
          region: a.region,
          environment: a.env,
          criticality: a.criticality,
          dataClassification: a.classification,
          containsPII: !!a.pii,
          containsHealthData: !!a.health,
          containsCardData: !!a.card,
          encryptionAtRest: !!a.encR,
          encryptionInTransit: !!a.encT,
          backupConfigured: !!a.backup,
          backupEncrypted: !!a.backupEnc,
          retentionDays: a.retention,
          crossBorderTransfer: !!a.xborder,
          publicExposure: !!a.pub,
          mfaEnforced: !!a.mfa,
          edrInstalled: !!a.edr,
          patchStatus: a.patch,
          lastPatchedAt: a.patch === "unknown" ? null : daysFromNow(-Math.floor(Math.random() * (a.patch === "critical" ? 60 : a.patch === "lagging" ? 30 : 10))),
          soci: !!a.soci,
          cdr: !!a.cdr,
          pci: !!a.pci,
          ownerId: a.owner ? userByEmail[a.owner].id : undefined,
        },
      })
    )
  );
  const assetByName = Object.fromEntries(assets.map((a) => [a.name, a]));

  // Asset ↔ control links
  const links: { asset: string; controls: string[] }[] = [
    { asset: "prod-customer-db", controls: ["APP-11", "PCI-3", "ISO-A.8.16", "NIST-PR.DS", "E8-8"] },
    { asset: "prod-api-cluster", controls: ["E8-7", "SOC2-CC6.1", "ISO-A.8.16"] },
    { asset: "prod-payments-svc", controls: ["PCI-1", "PCI-3", "PCI-10", "PCI-11"] },
    { asset: "cdr-api-gateway", controls: ["CDR-API", "CDR-CONSENT", "APP-11"] },
    { asset: "soci-energy-control", controls: ["SOCI-RMP", "SOCI-12H", "SOCI-72H"] },
    { asset: "stage-east-legacy-01", controls: ["E8-6"] },
    { asset: "clinical-records-svc", controls: ["APP-11", "APP-12", "APP-13", "ISO-A.8.16"] },
    { asset: "analytics-replica-uswest", controls: ["APP-8", "APP-11"] },
    { asset: "internal-jenkins", controls: ["SOC2-CC8.1", "E8-5"] },
    { asset: "gitlab-source-repo", controls: ["SOC2-CC8.1", "E8-5", "E8-7"] },
    { asset: "k8s-prod-cluster", controls: ["ISO-A.8.16", "NIST-ID.AM"] },
  ];
  await Promise.all(
    links.flatMap(({ asset, controls }) =>
      controls.map((cc) =>
        prisma.assetControl.create({
          data: { assetId: assetByName[asset].id, controlId: ctrlByCode[cc].id },
        })
      )
    )
  );

  // ---------------- Risks ----------------
  console.log("Seeding risks…");
  const risks = [
    { title: "Cross-border PII transfer to US analytics replica without DPIA", description: "Customer PII replicated to us-west-2 without a documented Privacy Impact Assessment, contrary to APP 8.", category: "privacy", L: 4, I: 5, status: "mitigating", treatment: "mitigate", owner: "sarah.nguyen@example.com.au", refs: ["PRIVACY_ACT"], plan: "Complete PIA and obtain customer consent or move processing back to ap-southeast-2." },
    { title: "Patch SLA breach on stage-east legacy hosts (Essential 8 maturity 1)", description: "14 Windows Server hosts >30 days behind on OS patches.", category: "cyber", L: 4, I: 4, status: "open", treatment: "mitigate", owner: "olivia.murray@example.com.au", refs: ["ESSENTIAL8"], plan: "Decommission by Q3 2026; compensating controls in place." },
    { title: "Vendor concentration on single SaaS support provider", description: "Helpdesk SaaS holds PII for 100% of customers; vendor based offshore with limited SOC 2 evidence.", category: "third_party", L: 3, I: 4, status: "mitigating", treatment: "mitigate", owner: "sarah.nguyen@example.com.au", refs: ["APRA_CPS234", "PRIVACY_ACT"], plan: "Renegotiate DPA, request fresh SOC 2 Type II by Aug 2026." },
    { title: "Insufficient supply chain hazard analysis (SOCI Part 2A)", description: "RMP supply chain section lacks mapping of upstream component dependencies for energy control asset.", category: "supply_chain", L: 3, I: 5, status: "open", treatment: "mitigate", owner: "michael.osullivan@example.com.au", refs: ["SOCI"], plan: "Engage external consultant to map BOM and review by 2026-08-30." },
    { title: "Shared admin account on old-wiki-onprem", description: "Legacy wiki has shared admin credentials, no MFA, no EDR.", category: "cyber", L: 3, I: 2, status: "open", treatment: "mitigate", owner: "james.tanaka@example.com.au", refs: ["ESSENTIAL8", "ISO27001"], plan: "Migrate content to Confluence; retire host." },
    { title: "Dormant contractor account with prod read access", description: "Identity remains active 120 days after offboarding.", category: "cyber", L: 3, I: 4, status: "mitigating", treatment: "mitigate", owner: "michael.osullivan@example.com.au", refs: ["ESSENTIAL8", "SOC2", "APRA_CPS234"], plan: "Auto-disable accounts after 60 days dormancy via Okta workflow." },
    { title: "MFA disabled on engineer account (J. Tanaka)", description: "Critical baseline control gap.", category: "cyber", L: 4, I: 3, status: "open", treatment: "mitigate", owner: "michael.osullivan@example.com.au", refs: ["ESSENTIAL8"], plan: "Enforce MFA via conditional access by EOW." },
    { title: "Missing backup configuration on internal-jenkins", description: "Build pipeline server has no automated backups.", category: "operational", L: 3, I: 3, status: "open", treatment: "mitigate", owner: "olivia.murray@example.com.au", refs: ["ESSENTIAL8"], plan: "Add daily snapshot to S3 Glacier with object lock." },
    { title: "Logging gap on stage environment", description: "Stage cluster logs not centralised; risk of missed pre-prod indicators.", category: "operational", L: 2, I: 2, status: "accepted", treatment: "accept", owner: "raj.patel@example.com.au", refs: ["ISO27001"], plan: "Accept until Q4 budget cycle." },
    { title: "Cyber insurance renewal contingent on Essential 8 ML2", description: "Insurer requires Maturity Level 2 across all eight strategies by renewal date.", category: "compliance", L: 5, I: 3, status: "mitigating", treatment: "mitigate", owner: "tom.fitzgerald@example.com.au", refs: ["ESSENTIAL8"], plan: "Application control + patch automation by 2026-09-01." },
  ];
  await Promise.all(
    risks.map((r) =>
      prisma.risk.create({
        data: {
          title: r.title,
          description: r.description,
          category: r.category,
          likelihood: r.L,
          impact: r.I,
          inherentScore: r.L * r.I,
          residualScore: Math.max(1, r.L * r.I - (r.status === "mitigating" ? 4 : r.status === "accepted" ? 0 : 2)),
          status: r.status,
          treatment: r.treatment,
          mitigationPlan: r.plan,
          ownerId: r.owner ? userByEmail[r.owner].id : undefined,
          dueDate: daysFromNow(Math.floor(Math.random() * 120) + 14),
          frameworkRefs: JSON.stringify(r.refs),
        },
      })
    )
  );

  // ---------------- Incidents ----------------
  console.log("Seeding incidents…");
  const incident1 = await prisma.incident.create({
    data: {
      ref: "INC-2026-0142",
      title: "Suspected credential stuffing on customer login API",
      description: "SIEM detected anomalous login pattern from rotating IPs targeting /v2/auth. ~3,200 accounts triggered MFA challenge; 18 confirmed lockouts.",
      severity: "high",
      status: "contained",
      detectionSource: "siem",
      detectedAt: hoursFromNow(-30),
      containedAt: hoursFromNow(-26),
      ndbApplicable: false,
      sociReportable: false,
      apraReportable: false,
      recordsAffected: 18,
      piiAffected: true,
      assigneeId: userByEmail["raj.patel@example.com.au"].id,
      assets: { create: [{ assetId: assetByName["prod-api-cluster"].id }] },
      timeline: {
        create: [
          { eventType: "detected", description: "SIEM rule R-AUTH-007 fired on anomalous login velocity", actor: "Datadog SIEM", occurredAt: hoursFromNow(-30) },
          { eventType: "escalated", description: "On-call paged Raj Patel (Sec Lead)", actor: "PagerDuty", occurredAt: hoursFromNow(-29.5) },
          { eventType: "contained", description: "WAF rate limit applied, suspicious ASNs blocklisted", actor: "Raj Patel", occurredAt: hoursFromNow(-26) },
        ],
      },
    },
  });

  const incident2 = await prisma.incident.create({
    data: {
      ref: "INC-2026-0141",
      title: "Misconfigured S3 bucket exposed customer support attachments",
      description: "Bucket `hapana-support-uploads` had public ACL for ~6 hours after IaC drift. Logs show 11 GETs from 3 external IPs; potential exposure of PII attachments.",
      severity: "critical",
      status: "eradicated",
      detectionSource: "vendor",
      detectedAt: hoursFromNow(-60),
      containedAt: hoursFromNow(-58),
      resolvedAt: hoursFromNow(-12),
      rootCause: "Terraform module bumped major version; default ACL changed from private to public-read. PR review missed the diff.",
      ndbApplicable: true,
      ndbNotifiedOaic: true,
      ndbNotifiedUsers: false,
      ndbNotificationDate: hoursFromNow(-20),
      sociReportable: false,
      apraReportable: false,
      recordsAffected: 47,
      piiAffected: true,
      assigneeId: userByEmail["raj.patel@example.com.au"].id,
      lessonsLearned: "Pin Terraform module versions; add Checkov policy to block public S3 buckets; require dual review for IaC affecting prod data stores.",
      assets: { create: [{ assetId: assetByName["prod-customer-db"].id }, { assetId: assetByName["support-helpdesk-saas"].id }] },
      timeline: {
        create: [
          { eventType: "detected", description: "AWS Macie alert: public objects containing PII patterns", actor: "AWS Macie", occurredAt: hoursFromNow(-60) },
          { eventType: "contained", description: "Bucket policy restored to private; access logs preserved", actor: "Olivia Murray", occurredAt: hoursFromNow(-58) },
          { eventType: "notified", description: "OAIC notification submitted (Form C, ID OAIC-2026-3398)", actor: "Sarah Nguyen", occurredAt: hoursFromNow(-20) },
          { eventType: "recovered", description: "Forensic review confirms no further access; 47 individuals queued for notification", actor: "Raj Patel", occurredAt: hoursFromNow(-12) },
        ],
      },
    },
  });

  await prisma.incident.create({
    data: {
      ref: "INC-2026-0140",
      title: "Energy control HMI brief unavailability (SOCI)",
      description: "SCADA HMI for soci-energy-control unresponsive for 18 minutes during scheduled patch window; failover engaged. Investigating whether it qualifies as a 'critical cyber incident' under SOCI s30BC.",
      severity: "high",
      status: "open",
      detectionSource: "alert",
      detectedAt: hoursFromNow(-6),
      sociReportable: true,
      sociReportedAt: hoursFromNow(-3),
      ndbApplicable: false,
      apraReportable: false,
      assigneeId: userByEmail["olivia.murray@example.com.au"].id,
      assets: { create: [{ assetId: assetByName["soci-energy-control"].id }] },
      timeline: {
        create: [
          { eventType: "detected", description: "HMI heartbeat lost during patch deploy", actor: "Nagios", occurredAt: hoursFromNow(-6) },
          { eventType: "notified", description: "Initial notification to ASD within 12h window (ref CIRMP-2026-118)", actor: "Olivia Murray", occurredAt: hoursFromNow(-3) },
        ],
      },
    },
  });

  await prisma.incident.create({
    data: {
      ref: "INC-2026-0139",
      title: "Failed phishing simulation — finance team",
      description: "30% click-through on quarterly phishing test. Targeted retraining triggered.",
      severity: "low",
      status: "closed",
      detectionSource: "audit",
      detectedAt: daysFromNow(-14),
      containedAt: daysFromNow(-14),
      resolvedAt: daysFromNow(-2),
      rootCause: "Insufficient awareness of payment redirection scams.",
      lessonsLearned: "Add finance-specific scenarios to monthly micro-learning.",
      assigneeId: userByEmail["sarah.nguyen@example.com.au"].id,
    },
  });

  await prisma.incident.create({
    data: {
      ref: "INC-2026-0143",
      title: "APRA-reportable: degraded transaction processing 4h",
      description: "Payment service P95 latency >5s for 4h due to noisy neighbour in shared cluster. Customer-impacting.",
      severity: "high",
      status: "recovered",
      detectionSource: "siem",
      detectedAt: daysFromNow(-3),
      containedAt: daysFromNow(-3),
      resolvedAt: daysFromNow(-2),
      apraReportable: true,
      apraReportedAt: daysFromNow(-2),
      ndbApplicable: false,
      sociReportable: false,
      assigneeId: userByEmail["emma.chen@example.com.au"].id,
      assets: { create: [{ assetId: assetByName["prod-payments-svc"].id }] },
      timeline: {
        create: [
          { eventType: "detected", description: "Latency SLO burn detected", actor: "Datadog", occurredAt: daysFromNow(-3) },
          { eventType: "notified", description: "APRA material incident notification submitted", actor: "Tom Fitzgerald", occurredAt: daysFromNow(-2) },
        ],
      },
    },
  });

  // ---------------- Vulnerabilities ----------------
  console.log("Seeding vulnerabilities…");
  const vulnSeeds = [
    { cve: "CVE-2025-12345", title: "OpenSSL heap overflow in TLS record processing", severity: "critical", cvss: 9.8, asset: "stage-east-legacy-01", exposed: false, exploitable: true, status: "open", days: 25 },
    { cve: "CVE-2025-11999", title: "log4j-style JNDI injection in legacy collector", severity: "critical", cvss: 9.6, asset: "internal-jenkins", exposed: false, exploitable: true, status: "in_progress", days: 12, owner: "olivia.murray@example.com.au" },
    { cve: "CVE-2025-09001", title: "Spring Framework path traversal", severity: "high", cvss: 8.1, asset: "stage-api-cluster", exposed: false, exploitable: false, status: "open", days: 30 },
    { cve: "CVE-2024-87213", title: "nginx HTTP/3 worker DoS", severity: "high", cvss: 7.5, asset: "marketing-site", exposed: true, exploitable: true, status: "in_progress", days: 6 },
    { cve: "CVE-2024-77441", title: "PostgreSQL privilege escalation", severity: "medium", cvss: 6.5, asset: "prod-customer-db", exposed: false, exploitable: false, status: "mitigated", days: 60 },
    { cve: "CVE-2024-66001", title: "kubelet CVE — privileged escape", severity: "high", cvss: 8.4, asset: "k8s-prod-cluster", exposed: false, exploitable: false, status: "open", days: 18 },
    { cve: "CVE-2024-12821", title: "Outdated jQuery XSS sink", severity: "low", cvss: 3.4, asset: "old-wiki-onprem", exposed: false, exploitable: false, status: "open", days: 200 },
    { cve: null, title: "Default credentials on legacy admin UI", severity: "critical", cvss: 9.2, asset: "old-wiki-onprem", exposed: false, exploitable: true, status: "open", days: 90 },
    { cve: "CVE-2025-22002", title: "Container runtime escape", severity: "high", cvss: 8.8, asset: "k8s-prod-cluster", exposed: false, exploitable: false, status: "open", days: 4 },
    { cve: "CVE-2024-99988", title: "Hardcoded secret in build script", severity: "medium", cvss: 5.5, asset: "gitlab-source-repo", exposed: false, exploitable: false, status: "mitigated", days: 45 },
    { cve: "CVE-2025-30001", title: "Apache HTTP Server SSRF", severity: "high", cvss: 8.6, asset: "marketing-site", exposed: true, exploitable: true, status: "in_progress", days: 2 },
    { cve: "CVE-2024-55012", title: "Outdated Node.js (16.x) — multiple", severity: "medium", cvss: 6.1, asset: "stage-api-cluster", exposed: false, exploitable: false, status: "open", days: 35 },
    { cve: "CVE-2025-40010", title: "AWS SDK token leak via misconfigured logging", severity: "medium", cvss: 5.9, asset: "prod-api-cluster", exposed: false, exploitable: false, status: "mitigated", days: 22 },
    { cve: "CVE-2024-34567", title: "OpenSSH UseDNS spoofing", severity: "low", cvss: 3.1, asset: "internal-jenkins", exposed: false, exploitable: false, status: "accepted", days: 110 },
  ];
  const slaForSeverity = (sev: string) => (sev === "critical" ? 14 : sev === "high" ? 30 : sev === "medium" ? 60 : 90);
  await Promise.all(
    vulnSeeds.map((v) => {
      const discovered = daysFromNow(-v.days);
      return prisma.vulnerability.create({
        data: {
          cveId: v.cve,
          title: v.title,
          description: `Detected on ${v.asset}. ${v.exploitable ? "Listed in known exploited vulnerabilities catalog." : ""}`.trim(),
          severity: v.severity,
          cvssScore: v.cvss,
          assetId: assetByName[v.asset].id,
          status: v.status,
          exploitable: v.exploitable,
          exposed: v.exposed,
          discoveredAt: discovered,
          slaDueAt: new Date(discovered.getTime() + slaForSeverity(v.severity) * 86400_000),
          remediatedAt: v.status === "mitigated" ? daysFromNow(-2) : null,
          remediationOwner: (v as any).owner ? userByEmail[(v as any).owner].name : undefined,
        },
      });
    })
  );

  // ---------------- Evidence ----------------
  console.log("Seeding evidence…");
  const evidenceSeeds = [
    { title: "AWS Config snapshot — encryption-at-rest compliance", type: "scan_result", control: "APP-11", source: "aws_config" },
    { title: "Privacy Policy v3.4 — published intranet", type: "policy_doc", control: "APP-1.1", source: "manual" },
    { title: "Q1 2026 access review — production DB", type: "attestation", control: "E8-5", source: "manual" },
    { title: "Quarterly ASV scan report (PCI ASV)", type: "scan_result", control: "PCI-11", source: "audit_tool" },
    { title: "Restore test — prod-customer-db (Mar 2026)", type: "test_evidence", control: "E8-8", source: "manual" },
    { title: "OAIC notification ack — INC-2026-0141", type: "report", control: "NDB-NOTIFY", source: "manual" },
    { title: "RMP board approval minutes — 2026 review", type: "report", control: "SOCI-RMP", source: "manual" },
    { title: "Splunk SIEM rule coverage export", type: "log_export", control: "ISO-A.8.16", source: "splunk" },
    { title: "Vendor SOC 2 Type II — helpdesk SaaS", type: "attestation", control: "CPS234-2", source: "manual" },
    { title: "MFA enrollment evidence — privileged accounts", type: "scan_result", control: "E8-7", source: "manual" },
    { title: "CDR FAPI conformance test report", type: "test_evidence", control: "CDR-API", source: "audit_tool" },
    { title: "Patch compliance dashboard export", type: "scan_result", control: "E8-2", source: "audit_tool" },
  ];
  await Promise.all(
    evidenceSeeds.map((e, i) =>
      prisma.evidence.create({
        data: {
          title: e.title,
          type: e.type,
          controlId: ctrlByCode[e.control]?.id,
          source: e.source,
          collectedAt: daysFromNow(-Math.floor(Math.random() * 60) - 1),
          retentionUntil: daysFromNow(365 * (e.type === "log_export" ? 2 : 7)),
          immutable: true,
          reference: `s3://compliance-evidence/2026/${e.control}/${i}.pdf`,
          collectedBy: "system",
          auditRef: `AUD-2026-${(i + 1).toString().padStart(4, "0")}`,
        },
      })
    )
  );

  // ---------------- Access reviews ----------------
  console.log("Seeding access reviews…");
  await Promise.all([
    prisma.accessReview.create({ data: { scope: "Production database", reviewerId: userByEmail["michael.osullivan@example.com.au"].id, status: "in_progress", scheduledFor: daysFromNow(7) } }),
    prisma.accessReview.create({ data: { scope: "AWS admin accounts", reviewerId: userByEmail["michael.osullivan@example.com.au"].id, status: "pending", scheduledFor: daysFromNow(21) } }),
    prisma.accessReview.create({ data: { scope: "Contractor identities", reviewerId: userByEmail["sarah.nguyen@example.com.au"].id, status: "overdue", scheduledFor: daysFromNow(-12), findings: "1 dormant contractor account discovered (see risk register)." } }),
    prisma.accessReview.create({ data: { scope: "GitLab repository access", reviewerId: userByEmail["michael.osullivan@example.com.au"].id, status: "completed", scheduledFor: daysFromNow(-30), completedAt: daysFromNow(-28), findings: "Removed 4 inactive maintainer roles." } }),
  ]);

  // ---------------- Vendors ----------------
  console.log("Seeding vendors…");
  const vendorSeeds = [
    { name: "Amazon Web Services", category: "hosting", access: "restricted", risk: 25, status: "completed", attestations: ["SOC2", "ISO27001", "PCI_DSS", "IRAP"] },
    { name: "Microsoft Azure", category: "hosting", access: "restricted", risk: 28, status: "completed", attestations: ["SOC2", "ISO27001", "IRAP"] },
    { name: "Google Cloud", category: "hosting", access: "restricted", risk: 30, status: "completed", attestations: ["SOC2", "ISO27001"] },
    { name: "Stripe", category: "payments", access: "pii", risk: 22, status: "completed", attestations: ["SOC2", "PCI_DSS"] },
    { name: "Datadog", category: "saas", access: "internal", risk: 35, status: "completed", attestations: ["SOC2", "ISO27001"] },
    { name: "Atlassian (Jira, Confluence)", category: "saas", access: "internal", risk: 32, status: "completed", attestations: ["SOC2", "ISO27001"] },
    { name: "Okta", category: "saas", access: "restricted", risk: 38, status: "completed", attestations: ["SOC2", "ISO27001"], incidents: 1 },
    { name: "Helpscout (Support SaaS)", category: "saas", access: "pii", risk: 72, status: "expired", attestations: ["SOC2"], notes: "Attestation expired; offshore data hosting. See risk register." },
    { name: "Sentry", category: "saas", access: "internal", risk: 40, status: "in_progress", attestations: ["SOC2"] },
    { name: "GitLab", category: "saas", access: "internal", risk: 33, status: "completed", attestations: ["SOC2"] },
    { name: "Cloudflare", category: "saas", access: "internal", risk: 28, status: "completed", attestations: ["SOC2", "ISO27001", "PCI_DSS"] },
    { name: "Local IT Support Pty Ltd", category: "support", access: "internal", risk: 55, status: "not_started", attestations: [] },
  ];
  await Promise.all(
    vendorSeeds.map((v) =>
      prisma.vendor.create({
        data: {
          name: v.name,
          category: v.category,
          dataAccessLevel: v.access,
          riskScore: v.risk,
          assessmentStatus: v.status,
          lastAssessedAt: v.status === "completed" ? daysFromNow(-Math.floor(Math.random() * 180)) : null,
          nextAssessmentDue: daysFromNow(v.status === "expired" ? -30 : 180),
          contractExpires: daysFromNow(Math.floor(Math.random() * 365) + 90),
          attestations: JSON.stringify(v.attestations),
          incidents: (v as any).incidents ?? 0,
          notes: (v as any).notes,
        },
      })
    )
  );

  // ---------------- Changes ----------------
  console.log("Seeding changes…");
  await Promise.all([
    prisma.change.create({ data: { ref: "CHG-2026-0512", title: "Rotate KMS keys for prod-customer-db", description: "Annual encryption key rotation under PCI-3 / APP-11.", riskLevel: "medium", status: "approved", assetId: assetByName["prod-customer-db"].id, approverId: userByEmail["tom.fitzgerald@example.com.au"].id, scheduledFor: daysFromNow(3) } }),
    prisma.change.create({ data: { ref: "CHG-2026-0511", title: "Patch K8s control plane to 1.30.4", description: "Address kubelet CVE-2024-66001.", riskLevel: "high", status: "pending_approval", assetId: assetByName["k8s-prod-cluster"].id, scheduledFor: daysFromNow(5) } }),
    prisma.change.create({ data: { ref: "CHG-2026-0510", title: "Emergency block external IPs (INC-2026-0142)", description: "WAF rule update during credential stuffing incident.", riskLevel: "emergency", status: "deployed", assetId: assetByName["prod-api-cluster"].id, approverId: userByEmail["raj.patel@example.com.au"].id, deployedAt: hoursFromNow(-26), emergency: true } }),
    prisma.change.create({ data: { ref: "CHG-2026-0509", title: "Restore S3 bucket policy to private (INC-2026-0141)", description: "Emergency remediation of misconfigured bucket.", riskLevel: "emergency", status: "deployed", approverId: userByEmail["raj.patel@example.com.au"].id, deployedAt: hoursFromNow(-58), emergency: true } }),
    prisma.change.create({ data: { ref: "CHG-2026-0508", title: "Deploy v2.14 of payments service", description: "Latency-fix release.", riskLevel: "medium", status: "rolled_back", assetId: assetByName["prod-payments-svc"].id, approverId: userByEmail["emma.chen@example.com.au"].id, deployedAt: daysFromNow(-4), rollbackAt: daysFromNow(-3) } }),
    prisma.change.create({ data: { ref: "CHG-2026-0507", title: "Onboard new Datadog log pipeline", description: "Stage cluster log forwarding addition.", riskLevel: "low", status: "deployed", approverId: userByEmail["raj.patel@example.com.au"].id, deployedAt: daysFromNow(-7) } }),
    prisma.change.create({ data: { ref: "CHG-2026-0506", title: "Decommission old-wiki-onprem", description: "Migrate content to Confluence and retire host.", riskLevel: "medium", status: "draft" } }),
  ]);

  // ---------------- Policies ----------------
  console.log("Seeding policies…");
  await Promise.all([
    prisma.policy.create({ data: { code: "POL-PRIV-001", title: "Privacy & Personal Information Handling Policy", category: "privacy", version: "3.4", status: "published", owner: "Sarah Nguyen", effectiveDate: daysFromNow(-180), reviewDate: daysFromNow(185), summary: "Implements the Australian Privacy Principles and NDB obligations.", frameworkRefs: JSON.stringify(["PRIVACY_ACT", "NDB"]) } }),
    prisma.policy.create({ data: { code: "POL-SEC-001", title: "Information Security Policy", category: "security", version: "5.1", status: "published", owner: "Raj Patel", effectiveDate: daysFromNow(-300), reviewDate: daysFromNow(65), summary: "Master information security policy aligned to ISO 27001.", frameworkRefs: JSON.stringify(["ISO27001", "APRA_CPS234", "SOC2"]) } }),
    prisma.policy.create({ data: { code: "POL-IR-001", title: "Cyber Incident Response Plan", category: "incident", version: "2.7", status: "published", owner: "Raj Patel", effectiveDate: daysFromNow(-90), reviewDate: daysFromNow(275), summary: "IR playbooks covering NDB, SOCI 12h/72h, and APRA 72h.", frameworkRefs: JSON.stringify(["NDB", "SOCI", "APRA_CPS234"]) } }),
    prisma.policy.create({ data: { code: "POL-RET-001", title: "Data Retention & Destruction Policy", category: "retention", version: "1.9", status: "under_review", owner: "Sarah Nguyen", effectiveDate: daysFromNow(-400), reviewDate: daysFromNow(-15), summary: "Retention schedules per data class and regulator.", frameworkRefs: JSON.stringify(["PRIVACY_ACT", "PCI_DSS"]) } }),
    prisma.policy.create({ data: { code: "POL-AUP-001", title: "Acceptable Use Policy", category: "acceptable_use", version: "4.0", status: "published", owner: "People & Culture", effectiveDate: daysFromNow(-60), reviewDate: daysFromNow(305), summary: "Acceptable use of corporate IT, includes workplace surveillance notice.", frameworkRefs: JSON.stringify(["ISO27001"]) } }),
    prisma.policy.create({ data: { code: "POL-CHG-001", title: "Change Management Policy", category: "change", version: "2.2", status: "published", owner: "Emma Chen", effectiveDate: daysFromNow(-200), reviewDate: daysFromNow(165), summary: "Standard, normal and emergency change processes.", frameworkRefs: JSON.stringify(["SOC2", "APRA_CPS234"]) } }),
    prisma.policy.create({ data: { code: "POL-VEN-001", title: "Third Party / Vendor Management Policy", category: "security", version: "1.4", status: "published", owner: "Sarah Nguyen", effectiveDate: daysFromNow(-150), reviewDate: daysFromNow(215), summary: "DDQ, security review, and ongoing monitoring of vendors.", frameworkRefs: JSON.stringify(["APRA_CPS234", "SOCI"]) } }),
    prisma.policy.create({ data: { code: "POL-BCP-001", title: "Business Continuity & DR Policy", category: "security", version: "3.0", status: "published", owner: "Olivia Murray", effectiveDate: daysFromNow(-100), reviewDate: daysFromNow(265), summary: "RTO/RPO targets, DR testing cadence.", frameworkRefs: JSON.stringify(["ISO27001", "APRA_CPS234"]) } }),
  ]);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
