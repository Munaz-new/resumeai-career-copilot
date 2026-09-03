import { useMemo, useState } from "react";
import { TrendingUp, Sparkles } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysisStore";

interface Improvement {
  id: string;
  label: string;
  delta: number;
}

export function ScoreSimulator({ result }: { result: AnalysisResult }) {
  const improvements = useMemo<Improvement[]>(() => {
    const items: Improvement[] = [];
    for (const skill of (result.missingSkills || []).slice(0, 6)) {
      items.push({ id: `skill-${skill}`, label: `Add skill: ${skill}`, delta: 4 });
    }
    if ((result.formattingScore ?? 100) < 80) {
      items.push({ id: "summary", label: "Add a professional summary", delta: 3 });
    }
    if ((result.sectionCompleteness ?? 100) < 80) {
      items.push({ id: "projects", label: "Add a Projects section", delta: 5 });
    }
    if ((result.quantifiedRatio ?? 100) < 40) {
      items.push({ id: "metrics", label: "Quantify bullets with metrics", delta: 6 });
    }
    if ((result.weakBullets?.length ?? 0) > 0) {
      items.push({ id: "verbs", label: "Replace weak verbs with strong ones", delta: 4 });
    }
    if (!items.length) items.push({ id: "polish", label: "Polish wording for clarity", delta: 2 });
    return items;
  }, [result]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const baseScore = result.atsScore;
  const simulated = Math.min(
    100,
    baseScore + Array.from(selected).reduce((sum, id) => sum + (improvements.find((i) => i.id === id)?.delta ?? 0), 0)
  );

  const toggle = (id: string) =>
    setSelected((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  return (
    <div className="dashboard-card animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Score Simulator
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{baseScore}</span>
          <span className="text-muted-foreground">→</span>
          <span className="font-bold text-primary text-lg transition-all">{simulated}</span>
          {simulated > baseScore && (
            <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
              +{simulated - baseScore}
            </span>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Toggle improvements to preview their impact on your ATS score.
      </p>
      <div className="space-y-2">
        {improvements.map((imp) => {
          const on = selected.has(imp.id);
          return (
            <button
              key={imp.id}
              onClick={() => toggle(imp.id)}
              className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl text-left text-sm transition-all border ${
                on ? "bg-primary/5 border-primary/30" : "bg-muted/50 border-transparent hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className={`w-3.5 h-3.5 ${on ? "text-primary" : "text-muted-foreground"}`} />
                <span className={on ? "text-foreground font-medium" : "text-foreground"}>{imp.label}</span>
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${on ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                +{imp.delta}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}