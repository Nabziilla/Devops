"use client";

import { Search, Bell, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { getNotifications, type NotificationItem } from "./actions";

interface SearchEntry {
  label: string;
  hint: string;
  href: string;
  keywords: string[];
}

const SEARCH_INDEX: SearchEntry[] = [
  { label: "Executive overview", hint: "Dashboard", href: "/", keywords: ["dashboard", "home", "overview", "exec"] },
  { label: "Asset inventory", hint: "Assets", href: "/assets", keywords: ["assets", "inventory", "cloud", "saas", "server", "database"] },
  { label: "Compliance controls", hint: "Controls", href: "/controls", keywords: ["controls", "compliance", "framework", "iso", "soc2", "essential8"] },
  { label: "Risk register", hint: "Risks", href: "/risks", keywords: ["risk", "register", "treatment", "residual"] },
  { label: "Incident response", hint: "Incidents", href: "/incidents", keywords: ["incident", "ndb", "soci", "apra", "breach"] },
  { label: "IR runbook", hint: "Runbook", href: "/incidents/runbook", keywords: ["runbook", "playbook", "ir", "response"] },
  { label: "Vulnerability management", hint: "Vulnerabilities", href: "/vulnerabilities", keywords: ["vulnerability", "cve", "cvss", "sbom", "scan", "patch"] },
  { label: "Evidence repository", hint: "Evidence", href: "/evidence", keywords: ["evidence", "audit", "retention", "log"] },
  { label: "Identity & access", hint: "IAM", href: "/iam", keywords: ["iam", "identity", "access", "mfa", "review", "user"] },
  { label: "Vendor risk", hint: "Vendors", href: "/vendors", keywords: ["vendor", "third party", "ddq", "supplier"] },
  { label: "Change management", hint: "Changes", href: "/changes", keywords: ["change", "deployment", "release", "approval"] },
  { label: "Policies & standards", hint: "Policies", href: "/policies", keywords: ["policy", "policies", "standard", "governance"] },
  { label: "Frameworks", hint: "Frameworks", href: "/frameworks", keywords: ["framework", "privacy act", "soci", "apra", "essential", "cdr"] },
];

export default function Topbar() {
  const router = useRouter();
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotificationItem[] | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const searchWrap = useRef<HTMLFormElement>(null);
  const notifsWrap = useRef<HTMLDivElement>(null);

  const results = query.trim()
    ? SEARCH_INDEX.filter((e) => {
        const q = query.toLowerCase();
        return e.label.toLowerCase().includes(q) || e.keywords.some((k) => k.includes(q));
      }).slice(0, 8)
    : [];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchWrap.current && !searchWrap.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifsWrap.current && !notifsWrap.current.contains(e.target as Node)) setNotifsOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        (document.getElementById("global-search") as HTMLInputElement | null)?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function go(entry: SearchEntry) {
    setQuery("");
    setSearchOpen(false);
    router.push(entry.href);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (results.length > 0) go(results[Math.min(activeIdx, results.length - 1)]);
  }

  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setSearchOpen(false);
    }
  }

  async function openNotifs() {
    setNotifsOpen((open) => !open);
    if (notifs === null) {
      const items = await getNotifications();
      setNotifs(items);
    }
  }

  const unread = notifs?.length ?? 0;

  return (
    <header className="h-14 shrink-0 border-b border-border bg-background flex items-center px-6 gap-4 relative z-30">
      <form onSubmit={onSubmit} className="flex-1 max-w-xl relative" ref={searchWrap}>
        <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          id="global-search"
          autoComplete="off"
          placeholder="Search assets, controls, incidents… (⌘K)"
          value={query}
          onFocus={() => setSearchOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); setActiveIdx(0); }}
          onKeyDown={onSearchKey}
          className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
        />
        {searchOpen && results.length > 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            {results.map((r, idx) => (
              <button
                type="button"
                key={r.href}
                onMouseEnter={() => setActiveIdx(idx)}
                onClick={() => go(r)}
                className={cn(
                  "w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 transition-colors",
                  idx === activeIdx ? "bg-accent" : "hover:bg-accent/50"
                )}
              >
                <span className="text-sm font-medium">{r.label}</span>
                <span className="text-xs text-muted-foreground">{r.hint}</span>
              </button>
            ))}
          </div>
        )}
        {searchOpen && query.trim() && results.length === 0 && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-card border border-border rounded-xl shadow-lg p-4 text-sm text-muted-foreground">
            No matches in navigation. Try: assets, risks, incidents, ndb, soci, vendor, sbom.
          </div>
        )}
      </form>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => toast("Ask-AI is not configured in this environment. Set ANTHROPIC_API_KEY to enable.", "info")}
        >
          <Sparkles className="size-4" />
          <span className="hidden md:inline">Ask AI</span>
        </button>
        <div className="relative" ref={notifsWrap}>
          <button
            type="button"
            onClick={openNotifs}
            aria-label="Notifications"
            className="size-9 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground transition-colors relative"
          >
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 min-w-[1rem] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          {notifsOpen && (
            <div className="absolute right-0 top-full mt-2 w-96 max-h-[60vh] overflow-y-auto bg-card border border-border rounded-xl shadow-lg">
              <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="text-sm font-semibold">Live alerts</div>
                <button type="button" aria-label="Close" onClick={() => setNotifsOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-3.5" />
                </button>
              </div>
              {notifs === null && <div className="p-4 text-sm text-muted-foreground">Loading…</div>}
              {notifs && notifs.length === 0 && <div className="p-6 text-sm text-muted-foreground text-center">All clear. No regulatory or SLA breaches.</div>}
              {notifs && notifs.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => { setNotifsOpen(false); router.push(n.href); }}
                  className="w-full text-left p-3 border-b border-border/60 last:border-b-0 hover:bg-accent transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className={cn(
                      "mt-1.5 size-2 rounded-full shrink-0",
                      n.tone === "critical" ? "bg-destructive" : n.tone === "warn" ? "bg-yellow-500" : "bg-primary"
                    )} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{n.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{n.detail}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2.5 pl-3 pr-1 py-1 rounded-full hover:bg-accent transition-colors cursor-default">
          <div className="text-right hidden sm:block">
            <div className="text-foreground leading-none text-xs font-semibold">N. Sabih</div>
            <div className="text-[10px] text-muted-foreground leading-none mt-0.5">Platform Engineering</div>
          </div>
          <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
            NS
          </div>
        </div>
      </div>
    </header>
  );
}
