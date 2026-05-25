"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastTone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: ToastTone };

interface Ctx {
  toast: (message: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => setToasts((cur) => cur.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? AlertCircle : Info;
  const toneCls =
    toast.tone === "success"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : toast.tone === "error"
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : "border-primary/40 bg-primary/10 text-primary";
  return (
    <div
      className={cn(
        "pointer-events-auto min-w-[280px] max-w-md rounded-xl border bg-card shadow-lg px-4 py-3 flex items-start gap-3 animate-in slide-in-from-bottom-2",
        toneCls
      )}
    >
      <Icon className="size-4 mt-0.5 shrink-0" />
      <div className="text-sm flex-1 text-foreground">{toast.message}</div>
      <button onClick={onClose} aria-label="Dismiss" className="text-muted-foreground hover:text-foreground">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx.toast;
}
