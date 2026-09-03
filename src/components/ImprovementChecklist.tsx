import { useState } from "react";
import { CheckCircle2, Circle, AlertTriangle, ArrowUp, ArrowRight, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "@/lib/analysisStore";

interface ChecklistItem {
  id: string;
  text: string;
  priority: "High" | "Medium" | "Low";
  reason: string;
}

function generateChecklist(result: AnalysisResult): ChecklistItem[] {
  const items: ChecklistItem[] = [];
  let id = 0;

  if (result.formattingScore < 60) {
    if (!result.suggestions.some((s) => s.includes("summary"))) {
      items.push({ id: String(id++), text: "Add a professional summary section", priority: "High", reason: "A summary gives recruiters a quick overview and improves ATS parsing" });
    }
  }

  if (result.sectionCompleteness < 80) {
    items.push({ id: String(id++), text: "Add missing resume sections (Projects, Certifications)", priority: "Medium", reason: "Complete sections improve ATS score and demonstrate breadth" });
  }

  for (const skill of result.missingSkills.slice(0, 5)) {
    items.push({ id: String(id++), text: `Add missing skill: ${skill}`, priority: "High", reason: `Required by the job description but not found in your resume` });
  }

  if (result.readabilityScore < 60) {
    items.push({ id: String(id++), text: "Add bullet points with measurable achievements", priority: "High", reason: "Quantified results (%, $, #) make your impact concrete" });
    items.push({ id: String(id++), text: "Improve action verbs in experience bullets", priority: "Medium", reason: "Strong verbs like 'Architected', 'Spearheaded' show leadership" });
  }

  if (result.keywordMatch < 50) {
    items.push({ id: String(id++), text: "Mirror more keywords from the job description", priority: "High", reason: "ATS systems scan for exact keyword matches" });
  }

  if (result.formattingScore < 80) {
    items.push({ id: String(id++), text: "Add clear section headers (Skills, Experience, Education)", priority: "Medium", reason: "Proper formatting helps ATS parse your resume correctly" });
  }

  items.push({ id: String(id++), text: "Add relevant certifications", priority: "Low", reason: "Certifications add credibility and boost ATS keyword matching" });
  items.push({ id: String(id++), text: "Proofread for grammar and spelling", priority: "Low", reason: "Errors can cause ATS misreads and look unprofessional" });

  return items;
}

const priorityConfig = {
  High: { icon: ArrowUp, color: "text-destructive", bg: "bg-destructive/10" },
  Medium: { icon: ArrowRight, color: "text-warning", bg: "bg-warning/10" },
  Low: { icon: ArrowDown, color: "text-info", bg: "bg-info/10" },
};

export function ImprovementChecklist({ result }: { result: AnalysisResult }) {
  const items = generateChecklist(result);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const completed = checked.size;
  const total = items.length;

  return (
    <div className="dashboard-card animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          Improvement Checklist
        </h3>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {completed}/{total} done
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const done = checked.has(item.id);
          const P = priorityConfig[item.priority];
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={cn(
                "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all",
                done ? "bg-success/5 opacity-60" : "bg-muted/50 hover:bg-muted"
              )}
            >
              {done ? (
                <CheckCircle2 className="w-5 h-5 text-success mt-0.5 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground/40 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn("text-sm font-medium", done && "line-through text-muted-foreground")}>
                    {item.text}
                  </span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", P.bg, P.color)}>
                    {item.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{item.reason}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
