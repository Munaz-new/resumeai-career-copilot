import { CheckCircle2, AlertTriangle, XCircle, Flame } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysisStore";

export function JDHeatmap({ result }: { result: AnalysisResult }) {
  const matched = result.matchedSkills || [];
  const partial = result.partialSkills || [];
  const missing = result.missingSkills || [];
  const fastWins = missing.slice(0, 3);

  return (
    <div className="dashboard-card animate-fade-in">
      <div className="mb-5">
        <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
          <Flame className="w-4 h-4 text-warning" />
          Resume vs JD Heatmap
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Visual map of how your resume aligns with the job description.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Column
          title="Matched"
          icon={<CheckCircle2 className="w-4 h-4 text-success" />}
          dot="bg-success"
          chipClass="bg-success/10 text-success border-success/20"
          items={matched}
          empty="No exact matches yet"
        />
        <Column
          title="Partial"
          icon={<AlertTriangle className="w-4 h-4 text-warning" />}
          dot="bg-warning"
          chipClass="bg-warning/10 text-warning border-warning/20"
          items={partial}
          empty="No partial matches"
        />
        <Column
          title="Missing"
          icon={<XCircle className="w-4 h-4 text-destructive" />}
          dot="bg-destructive"
          chipClass="bg-destructive/10 text-destructive border-destructive/20"
          items={missing}
          empty="Nothing missing — nice!"
        />
      </div>
      {fastWins.length > 0 && (
        <div className="mt-5 p-4 rounded-xl bg-muted/50 border border-border">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Fastest Wins</p>
          <p className="text-sm text-foreground">
            Adding{" "}
            <span className="font-semibold text-primary">{fastWins.join(", ")}</span>{" "}
            to your resume would give the biggest ATS boost.
          </p>
        </div>
      )}
    </div>
  );
}

function Column({
  title, icon, dot, chipClass, items, empty,
}: {
  title: string; icon: React.ReactNode; dot: string; chipClass: string; items: string[]; empty: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        {icon}
        <span className="text-sm font-semibold text-foreground">
          {title} <span className="text-muted-foreground font-normal">({items.length})</span>
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.slice(0, 30).map((s) => (
            <span key={s} className={`text-xs px-2.5 py-1 rounded-full border font-medium ${chipClass}`}>
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}