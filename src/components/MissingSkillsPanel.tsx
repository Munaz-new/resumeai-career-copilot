import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysisStore";
import { computeMissingSkillPriority, type PriorityMissingSkill } from "@/lib/suggestionContext";
import { cn } from "@/lib/utils";

export function MissingSkillsPanel({ result }: { result: AnalysisResult }) {
  const [openDetail, setOpenDetail] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const all = computeMissingSkillPriority(result.missingSkills, result.jobDescription);
    return {
      high: all.filter((s) => s.priority === "high"),
      nice: all.filter((s) => s.priority === "nice"),
    };
  }, [result.missingSkills, result.jobDescription]);

  if (result.missingSkills.length === 0) return null;

  return (
    <div className="dashboard-card animate-fade-in">
      <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive" />
        Missing Skills ({result.missingSkills.length})
      </h3>

      {grouped.high.length > 0 && (
        <Group label="High Priority" dot="bg-destructive" items={grouped.high} openId={openDetail} onToggle={setOpenDetail} />
      )}
      {grouped.nice.length > 0 && (
        <Group label="Nice to Have" dot="bg-warning" items={grouped.nice} openId={openDetail} onToggle={setOpenDetail} className={grouped.high.length ? "mt-5" : ""} />
      )}
    </div>
  );
}

function Group({
  label, dot, items, openId, onToggle, className,
}: {
  label: string;
  dot: string;
  items: PriorityMissingSkill[];
  openId: string | null;
  onToggle: (id: string | null) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase font-bold tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
        <span className={cn("w-2 h-2 rounded-full", dot)} />
        {label}
      </p>
      <div className="space-y-2">
        {items.map((it) => {
          const open = openId === it.skill;
          return (
            <div key={it.skill} className="rounded-lg border border-border bg-muted/30 overflow-hidden">
              <button
                onClick={() => onToggle(open ? null : it.skill)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground">{it.skill}</span>
                  {it.frequency > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {it.frequency}× in JD
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success">
                    +{it.impact} ATS
                  </span>
                  {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
              </button>
              {open && (
                <div className="px-3 pb-3 pt-1 text-xs text-muted-foreground leading-relaxed border-t border-border/60">
                  <p>
                    <span className="font-semibold text-foreground">Why?</span>{" "}
                    {it.frequency > 0
                      ? `Found ${it.frequency} time${it.frequency === 1 ? "" : "s"} in the job description.`
                      : `Common keyword for this role — recruiters expect it.`}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold text-foreground">Estimated ATS impact:</span>{" "}
                    +{Math.max(2, it.impact - 1)} to +{it.impact + 1}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
