"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  ListChecks,
  AlertTriangle,
  Siren,
  Bug,
  Users,
  Archive,
  Building2,
  GitPullRequest,
  ScrollText,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import HapanaLogo from "@/components/branding/hapana-logo";

const nav = [
  { href: "/", label: "Executive", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Server },
  { href: "/controls", label: "Controls", icon: ListChecks },
  { href: "/frameworks", label: "Frameworks", icon: BookOpen },
  { href: "/risks", label: "Risk Register", icon: AlertTriangle },
  { href: "/incidents", label: "Incidents", icon: Siren },
  { href: "/vulnerabilities", label: "Vulnerabilities", icon: Bug },
  { href: "/iam", label: "Identity & Access", icon: Users },
  { href: "/evidence", label: "Evidence", icon: Archive },
  { href: "/vendors", label: "Vendors", icon: Building2 },
  { href: "/changes", label: "Changes", icon: GitPullRequest },
  { href: "/policies", label: "Policies", icon: ScrollText },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="flex items-center pl-4 pr-6 py-4 border-b border-sidebar-border">
        <HapanaLogo className="text-primary" width={140} height={36} />
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "text-sidebar-primary font-semibold"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className={cn("size-4", active && "text-sidebar-primary")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border text-[11px] text-muted-foreground leading-relaxed">
        <div className="font-medium text-foreground/80 mb-1">Frameworks tracked</div>
        Privacy Act · NDB · SOCI · APRA CPS 234 · Essential 8 · CDR · PCI DSS · ISO 27001 · SOC 2 · NIST CSF
      </div>
    </aside>
  );
}
