import { Link } from "react-router-dom";
import { Sparkles, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLastAnalysis } from "@/lib/analysisStore";

interface Step {
  label: string;
  done: boolean;
  to?: string;
}

function computeSteps(): Step[] {
  const last = getLastAnalysis();
  const r = last?.fullResult;

  if (!r) {
    return [
      { label: "Upload your resume", done: false, to: "/analyzer" },
      { label: "Add a job description", done: false, to: "/analyzer" },
      { label: "Run your first ATS analysis", done: false, to: "/analyzer" },
    ];
  }

  const steps: Step[] = [
    { label: "Upload your resume", done: true },
    { label: "Add a job description", done: !!last?.jobDescriptionTitle },
    { label: "Run ATS analysis", done: true },
  ];

  if (r.atsScore < 75) {
    steps.push({
      label: `Improve ATS score to 75+ (currently ${r.atsScore})`,
      done: false,
      to: "/suggestions",
    });
  }

  const missing = r.missingSkills?.[0];
  if (missing) {
    steps.push({
      label: `Add missing skill: ${missing}`,
      done: false,
      to: "/builder",
    });
  }

  if (r.atsScore >= 75 && (!missing || r.missingSkills.length === 0)) {
    steps.push({ label: "You're job-ready — start applying!", done: false, to: "/compare" });
  }

  return steps.slice(0, 5);
}

export function NextBestStepCard() {
  const steps = computeSteps();
  const firstPending = steps.findIndex((s) => !s.done);

  return (
    <div className="dashboard-card animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-heading font-bold text-foreground text-sm">Your Next Best Step</h3>
          <p className="text-[11px] text-muted-foreground">AI guidance based on your latest analysis</p>
        </div>
      </div>

      <ol className="space-y-2">
        {steps.map((s, i) => {
          const isCurrent = i === firstPending;
          const content = (
            <div
              className={cn(
                "flex items-start gap-3 p-2.5 rounded-xl transition-colors",
                isCurrent && "bg-primary/5 border border-primary/20",
                !isCurrent && "hover:bg-muted/40"
              )}
            >
              {s.done ? (
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
              ) : (
                <Circle
                  className={cn(
                    "w-4 h-4 mt-0.5 shrink-0",
                    isCurrent ? "text-primary" : "text-muted-foreground/40"
                  )}
                />
              )}
              <span
                className={cn(
                  "text-sm leading-snug flex-1",
                  s.done && "text-muted-foreground line-through",
                  isCurrent && "text-foreground font-medium",
                  !s.done && !isCurrent && "text-foreground"
                )}
              >
                {s.label}
              </span>
              {isCurrent && s.to && (
                <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              )}
            </div>
          );

          return (
            <li key={i}>
              {s.to && !s.done ? <Link to={s.to}>{content}</Link> : content}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
