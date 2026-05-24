import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "default" | "good" | "warn" | "bad" | "info" | "purple";
  progress?: number; // 0-100
}

const toneStyles = {
  default: { text: "text-foreground", bar: "bg-primary", hover: "hover:bg-accent" },
  good:    { text: "text-green-600",  bar: "bg-green-500",  hover: "hover:bg-green-50" },
  warn:    { text: "text-yellow-600", bar: "bg-yellow-500", hover: "hover:bg-yellow-50" },
  bad:     { text: "text-red-600",    bar: "bg-red-500",    hover: "hover:bg-red-50" },
  info:    { text: "text-blue-600",   bar: "bg-blue-500",   hover: "hover:bg-blue-50" },
  purple:  { text: "text-purple-600", bar: "bg-purple-500", hover: "hover:bg-purple-50" },
};

export default function StatCard({ label, value, hint, icon: Icon, tone = "default", progress }: Props) {
  const s = toneStyles[tone];

  return (
    <div className={cn("card p-5 transition-colors cursor-default", s.hover)}>
      <div className="flex items-start justify-between mb-3">
        <div className="stat-label">{label}</div>
        {Icon && (
          <div className="size-8 rounded-full bg-muted flex items-center justify-center">
            <Icon className="size-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className={cn("stat", s.text)}>{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-2">{hint}</div>}
      {progress !== undefined && (
        <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", s.bar)} style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
        </div>
      )}
    </div>
  );
}
