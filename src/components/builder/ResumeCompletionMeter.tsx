import { useMemo } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import type { ResumeDraft, SectionType, ResumeSection, SectionData } from "@/lib/resumeDraft";
import { sectionTitle } from "@/lib/resumeDraft";

const REQUIRED: SectionType[] = ["summary", "skills", "experience", "projects", "education"];
const OPTIONAL: SectionType[] = ["certifications", "achievements"];

function isFilled(s: ResumeSection): boolean {
  switch (s.type) {
    case "summary":
      return (s.data as SectionData["summary"]).text.trim().length > 20;
    case "skills":
      return (s.data as SectionData["skills"]).items.length >= 3;
    case "projects":
    case "experience":
    case "education":
    case "certifications":
      return ((s.data as { items: unknown[] }).items || []).length > 0;
    case "achievements":
    case "activities":
      return ((s.data as { items: string[] }).items || []).length > 0;
  }
}

export function ResumeCompletionMeter({ draft }: { draft: ResumeDraft }) {
  const { pct, items } = useMemo(() => {
    const contactFilled =
      draft.contact.name.trim().length > 0 &&
      draft.contact.email.trim().length > 0;

    const items: { label: string; done: boolean; required: boolean }[] = [
      { label: "Contact", done: contactFilled, required: true },
    ];

    for (const type of [...REQUIRED, ...OPTIONAL]) {
      const section = draft.sections.find((s) => s.type === type && s.enabled);
      items.push({
        label: sectionTitle(type),
        done: section ? isFilled(section) : false,
        required: REQUIRED.includes(type),
      });
    }

    const weightTotal = items.reduce((a, i) => a + (i.required ? 2 : 1), 0);
    const weightDone = items.reduce((a, i) => a + (i.done ? (i.required ? 2 : 1) : 0), 0);
    const pct = Math.round((weightDone / weightTotal) * 100);
    return { pct, items };
  }, [draft]);

  const color = pct >= 80 ? "text-success" : pct >= 50 ? "text-warning" : "text-destructive";
  const fill = pct >= 80 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-destructive";

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-bold text-foreground text-sm">Resume Completion</h3>
        <span className={`font-mono text-xl font-extrabold ${color}`}>{pct}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-3">
        <div className={`h-full ${fill} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2 text-xs">
            {it.done ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
            ) : (
              <Circle className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
            )}
            <span className={it.done ? "text-foreground" : "text-muted-foreground"}>
              {it.label}
            </span>
            {!it.required && (
              <span className="text-[9px] uppercase font-bold text-muted-foreground/60 ml-auto">
                Optional
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
