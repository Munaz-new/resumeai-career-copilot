import { useMemo } from "react";
import { Zap, ArrowRight, Clock } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysisStore";
import { computeQuickWins } from "@/lib/suggestionContext";

export function QuickWinsPanel({ result }: { result: AnalysisResult }) {
  const { wins, projectedScore, estMinutes } = useMemo(() => computeQuickWins(result), [result]);
  if (wins.length === 0) return null;

  return (
    <div className="dashboard-card animate-fade-in border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          Fastest Improvements
        </h3>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
          <Clock className="w-3 h-3" />
          Est. {estMinutes}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-4 px-3 py-3 rounded-xl bg-background border border-border">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-base font-bold text-muted-foreground">{result.atsScore}</span>
          <ArrowRight className="w-4 h-4 text-primary" />
          <span className="font-mono text-xl font-extrabold text-success">{projectedScore}</span>
        </div>
        <span className="text-xs text-muted-foreground">projected ATS after quick wins</span>
      </div>

      <ul className="space-y-2">
        {wins.map((w, i) => (
          <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
            <span className="shrink-0 w-7 h-7 rounded-lg bg-success/10 text-success flex items-center justify-center text-[11px] font-bold">
              +{w.impact}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{w.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{w.why}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
