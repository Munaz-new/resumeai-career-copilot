import { Calendar, ArrowRight } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysisStore";

const FRAMINGS = [
  {
    label: "Career Break",
    wording: "Career Break — Family responsibilities and personal development",
    note: "Best for personal/family reasons. Honest and recruiter-safe.",
  },
  {
    label: "Professional Development Period",
    wording: "Professional Development — Completed online coursework and certifications in [skill]",
    note: "Best when you used the time to learn. Pair with certifications.",
  },
  {
    label: "Skill Building Phase",
    wording: "Skill Building — Self-directed projects and open-source contributions",
    note: "Best for technical roles. Link your GitHub or portfolio.",
  },
];

export function GapAssistant({ result }: { result: AnalysisResult }) {
  const gaps = result.employmentGaps || [];
  if (gaps.length === 0) return null;

  return (
    <div className="dashboard-card animate-fade-in">
      <div className="mb-5">
        <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          Employment Gap Assistant
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          We detected {gaps.length} timeline gap{gaps.length > 1 ? "s" : ""}. Here's how to frame {gaps.length > 1 ? "them" : "it"} professionally.
        </p>
      </div>

      <div className="space-y-2 mb-5">
        {gaps.map((g, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 text-sm">
            <span className="font-mono text-xs text-muted-foreground">{g.from}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
            <span className="font-mono text-xs text-muted-foreground">{g.to}</span>
            <span className="ml-auto text-xs font-semibold text-warning">~{g.months} months</span>
          </div>
        ))}
      </div>

      <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">Recruiter-safe framings</p>
      <div className="grid md:grid-cols-3 gap-3">
        {FRAMINGS.map((f) => (
          <div key={f.label} className="p-3 rounded-xl border border-border bg-background">
            <p className="text-xs font-bold text-primary mb-1">{f.label}</p>
            <p className="text-sm text-foreground font-medium mb-2">{f.wording}</p>
            <p className="text-xs text-muted-foreground">{f.note}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4 italic">
        Tip: Place the gap entry in your Experience section, not buried at the bottom. Keep the tone confident — never apologetic.
      </p>
    </div>
  );
}