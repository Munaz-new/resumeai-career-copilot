import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysisStore";
import { buildScoreBreakdown } from "@/lib/scoreBreakdown";

export function ScoreExplainPanel({ result }: { result: AnalysisResult }) {
  const [open, setOpen] = useState(true);
  const items = buildScoreBreakdown(result);
  if (items.length === 0) return null;

  return (
    <div className="dashboard-card animate-fade-in">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          ATS score breakdown
        </h3>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="mt-4 space-y-2">
          {items.map((it, i) => (
            <div
              key={i}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                it.positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              }`}
            >
              <span className="font-medium">{it.label}</span>
              {it.delta !== 0 && (
                <span className="font-mono font-semibold">
                  {it.delta > 0 ? "+" : ""}
                  {Number.isInteger(it.delta) ? it.delta : it.delta.toFixed(2)}
                </span>
              )}
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-2">
            ATS = keyword·35% + skills·20% + parseability·15% + formatting·10% + readability·10% + sections·5% + achievements·5%
          </p>
          <p className="text-xs text-muted-foreground">
            Missing skills are already reflected in the Skills Match score and are not subtracted again.
          </p>
        </div>
      )}
    </div>
  );
}
