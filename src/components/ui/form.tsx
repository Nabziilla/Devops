import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <span className="text-xs text-muted-foreground mt-1 block">{hint}</span>}
      {error && <span className="text-xs text-destructive mt-1 block">{error}</span>}
    </label>
  );
}

const baseInput =
  "w-full px-3.5 py-2 bg-card border border-input rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-colors disabled:opacity-50";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(baseInput, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(baseInput, "min-h-[80px]", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(baseInput, "pr-8", props.className)} />;
}

export function Checkbox({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        {...props}
        className={cn("size-4 rounded border-input accent-primary", props.className)}
      />
      <span className="text-sm text-foreground">{label}</span>
    </label>
  );
}

export function FormGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  const classes = {
    1: "grid grid-cols-1 gap-4",
    2: "grid grid-cols-1 sm:grid-cols-2 gap-4",
    3: "grid grid-cols-1 sm:grid-cols-3 gap-4",
  };
  return <div className={classes[cols]}>{children}</div>;
}
