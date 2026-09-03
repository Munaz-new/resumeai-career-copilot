import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight, Zap, TrendingUp, Target, Wrench, CheckCircle2 } from "lucide-react";
import { getLastAnalysis } from "@/lib/analysisStore";
import { enrichSuggestion } from "@/lib/suggestionContext";
import { InsightBlock } from "@/components/InsightBlock";
import { cn } from "@/lib/utils";
import { useState } from "react";

const priorityForSuggestion = (title: string): "High" | "Medium" | "Low" => {
  if (title.includes("Missing Skill") || title.includes("Summary") || title.includes("Measurable")) return "High";
  if (title.includes("Action Verbs") || title.includes("Projects") || title.includes("Bullet")) return "Medium";
  return "Low";
};

const priorityConfig = {
  High: { color: "text-destructive", bg: "bg-destructive/10" },
  Medium: { color: "text-warning", bg: "bg-warning/10" },
  Low: { color: "text-info", bg: "bg-info/10" },
};

export default function SuggestionsPage() {
  const last = getLastAnalysis();
  const r = last?.fullResult;
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  if (!r) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="mb-8 animate-fade-in">
            <h1 className="font-heading text-2xl font-extrabold text-foreground">Suggestions</h1>
            <p className="text-sm text-muted-foreground mt-1">Actionable improvements for your resume.</p>
          </div>
          <div className="dashboard-card flex flex-col items-center justify-center py-16 animate-fade-in">
            <Lightbulb className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h2 className="font-heading font-bold text-foreground text-lg mb-2">No Analysis Data</h2>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Analyze your resume first to get smart suggestions.
            </p>
            <Link to="/analyzer">
              <Button className="bg-primary text-primary-foreground font-semibold px-8 py-6 text-sm rounded-xl">
                Go to Analyzer <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const actionable = r.actionableSuggestions || [];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Smart Suggestions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Actionable improvements based on your latest analysis — each with a clear fix.
          </p>
        </div>

        {/* Actionable Suggestions */}
        {actionable.length > 0 && (
          <div className="space-y-3 mb-6 animate-fade-in">
            {actionable.map((s, i) => {
              const priority = priorityForSuggestion(s.title);
              const P = priorityConfig[priority];
              const isOpen = expanded.has(i);
              const enriched = enrichSuggestion(s, r);
              return (
                <div key={i} className="dashboard-card p-4">
                  <button onClick={() => toggle(i)} className="w-full text-left">
                    <div className="flex items-start gap-3">
                      <Target className={cn("w-5 h-5 mt-0.5 shrink-0", P.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-semibold text-foreground">{s.title}</span>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", P.bg, P.color)}>
                            {priority}
                          </span>
                          <span className="ml-auto text-[10px] font-bold text-success">{enriched.gain}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{enriched.problem}</p>
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <InsightBlock
                        problem={enriched.problem}
                        why={enriched.why}
                        fix={enriched.fix}
                        gain={enriched.gain}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* General suggestions */}
        <div className="dashboard-card mb-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-warning" />
            Quick Fixes
          </h3>
          <ul className="space-y-3">
            {r.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground leading-relaxed">{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bullet improvements */}
        {r.strongBullets && r.strongBullets.length > 0 && (
          <div className="dashboard-card animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Bullet Point Improvements
            </h3>
            <div className="space-y-4">
              {r.strongBullets.map((b, i) => (
                <div key={i} className="rounded-xl bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground line-through mb-1">{b.original}</p>
                  <p className="text-sm text-foreground font-medium">→ {b.improved}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
