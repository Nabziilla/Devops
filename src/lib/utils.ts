import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(d: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...opts,
  }).format(date);
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function daysUntil(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function severityColor(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical": return "text-red-600";
    case "high": return "text-orange-600";
    case "medium": return "text-yellow-600";
    case "low": return "text-green-600";
    default: return "text-text-muted";
  }
}

export function severityBg(severity: string): string {
  switch (severity?.toLowerCase()) {
    case "critical": return "bg-red-50 text-red-700 border-red-200";
    case "high":     return "bg-orange-50 text-orange-700 border-orange-200";
    case "medium":   return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "low":      return "bg-green-50 text-green-700 border-green-200";
    case "info":     return "bg-blue-50 text-blue-700 border-blue-200";
    default:         return "bg-bg-hover text-text-muted border-border";
  }
}

export function statusBg(status: string): string {
  const s = status?.toLowerCase();
  if (["compliant", "completed", "closed", "deployed", "approved", "recovered", "published"].includes(s)) {
    return "bg-green-50 text-green-700 border-green-200";
  }
  if (["partial", "in_progress", "pending_approval", "contained", "mitigating", "under_review"].includes(s)) {
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }
  if (["non_compliant", "open", "overdue", "expired", "rejected", "rolled_back"].includes(s)) {
    return "bg-red-50 text-red-700 border-red-200";
  }
  if (["not_applicable", "draft", "retired", "false_positive", "accepted"].includes(s)) {
    return "bg-bg-hover text-text-muted border-border";
  }
  return "bg-bg-hover text-text-muted border-border";
}

export function riskScoreLabel(score: number): { label: string; color: string } {
  if (score >= 20) return { label: "Critical", color: "text-red-600" };
  if (score >= 12) return { label: "High", color: "text-orange-600" };
  if (score >= 6) return { label: "Medium", color: "text-yellow-600" };
  return { label: "Low", color: "text-green-600" };
}

export function percent(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function safeJsonParse<T = unknown>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback;
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}
