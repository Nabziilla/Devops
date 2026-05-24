import { prisma } from "@/lib/db";
import PageHeader from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { cn, percent } from "@/lib/utils";
import { CheckCircle2, AlertCircle, XCircle, BookOpen } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FrameworksPage() {
  const frameworks = await prisma.framework.findMany({
    include: { controls: true },
    orderBy: [{ jurisdiction: "asc" }, { code: "asc" }],
  });

  return (
    <div>
      <PageHeader
        title="Compliance Frameworks"
        description="Australian and international frameworks tracked. Click a framework to see mapped controls and posture."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {frameworks.map((f) => {
          const compliant = f.controls.filter((c) => c.status === "compliant").length;
          const partial = f.controls.filter((c) => c.status === "partial").length;
          const non = f.controls.filter((c) => c.status === "non_compliant").length;
          const pct = percent(compliant, f.controls.length || 1);
          return (
            <Link
              key={f.id}
              href={`/controls?framework=${f.code}`}
              className="card p-4 card-hover block"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen className="size-4 text-primary" />
                    <div className="font-semibold">{f.code}</div>
                    {f.mandatory && (
                      <Badge className="border-risk-critical/40 text-risk-critical bg-risk-critical/10">
                        Mandatory
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-text-muted">{f.name}</div>
                </div>
                <div className="text-right">
                  <div className={cn(
                    "text-2xl font-semibold tabular-nums",
                    pct >= 80 ? "text-risk-low" : pct >= 60 ? "text-risk-medium" : "text-risk-critical"
                  )}>
                    {pct}%
                  </div>
                  <div className="text-[10px] text-text-dim uppercase tracking-wider">compliant</div>
                </div>
              </div>
              <p className="text-xs text-text-muted line-clamp-2 mb-3">{f.description}</p>
              <div className="flex items-center gap-2 mb-3">
                <Badge>{f.jurisdiction}</Badge>
                {f.regulator && <span className="text-xs text-text-muted">{f.regulator}</span>}
              </div>
              <div className="h-1.5 bg-bg-hover rounded-full overflow-hidden flex">
                <div className="bg-risk-low" style={{ width: `${percent(compliant, f.controls.length || 1)}%` }} />
                <div className="bg-risk-medium" style={{ width: `${percent(partial, f.controls.length || 1)}%` }} />
                <div className="bg-risk-critical" style={{ width: `${percent(non, f.controls.length || 1)}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-text-muted">
                <span className="flex items-center gap-1"><CheckCircle2 className="size-3 text-risk-low" /> {compliant} compliant</span>
                <span className="flex items-center gap-1"><AlertCircle className="size-3 text-risk-medium" /> {partial} partial</span>
                <span className="flex items-center gap-1"><XCircle className="size-3 text-risk-critical" /> {non} non-compliant</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
