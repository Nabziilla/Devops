import { Search, Bell, Sparkles } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-14 shrink-0 border-b border-border bg-background flex items-center px-6 gap-4">
      <div className="flex-1 max-w-xl relative">
        <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search assets, controls, incidents…"
          className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-full text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors"
        />
      </div>
      <div className="flex items-center gap-2">
        <button className="btn-ghost">
          <Sparkles className="size-4" />
          <span className="hidden md:inline">Ask AI</span>
        </button>
        <button className="size-9 rounded-full hover:bg-accent flex items-center justify-center text-muted-foreground transition-colors">
          <Bell className="size-4" />
        </button>
        <div className="flex items-center gap-2.5 pl-3 pr-1 py-1 rounded-full hover:bg-accent transition-colors cursor-pointer">
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
