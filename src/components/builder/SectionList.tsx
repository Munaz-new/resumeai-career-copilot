import { ArrowDown, ArrowUp, Eye, EyeOff, Plus } from "lucide-react";
import type { ResumeSection, SectionType } from "@/lib/resumeDraft";
import { sectionTitle, newSection } from "@/lib/resumeDraft";
import { cn } from "@/lib/utils";

const ALL: SectionType[] = [
  "summary",
  "skills",
  "projects",
  "experience",
  "education",
  "certifications",
  "achievements",
  "activities",
];

export function SectionList({
  sections,
  activeId,
  onSelect,
  onChange,
}: {
  sections: ResumeSection[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onChange: (s: ResumeSection[]) => void;
}) {
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  const toggle = (id: string) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  };

  const move = (id: string, dir: -1 | 1) => {
    const idx = sorted.findIndex((s) => s.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swap];
    onChange(
      sections.map((s) => {
        if (s.id === a.id) return { ...s, order: b.order };
        if (s.id === b.id) return { ...s, order: a.order };
        return s;
      })
    );
  };

  const missing = ALL.filter((t) => !sections.find((s) => s.type === t));

  const add = (t: SectionType) => {
    const order = sections.length;
    onChange([...sections, newSection(t, order)]);
  };

  return (
    <div className="space-y-1">
      {sorted.map((s, i) => (
        <div
          key={s.id}
          className={cn(
            "group flex items-center gap-1 rounded-lg border px-2 py-1.5 text-sm transition-all",
            activeId === s.id ? "border-primary bg-primary/5" : "border-border bg-card",
            !s.enabled && "opacity-50"
          )}
        >
          <button
            onClick={() => onSelect(s.id)}
            className="flex-1 text-left font-medium text-foreground truncate"
          >
            {sectionTitle(s.type)}
          </button>
          <button
            onClick={() => move(s.id, -1)}
            disabled={i === 0}
            className="p-1 rounded hover:bg-muted disabled:opacity-30"
            aria-label="Move up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => move(s.id, 1)}
            disabled={i === sorted.length - 1}
            className="p-1 rounded hover:bg-muted disabled:opacity-30"
            aria-label="Move down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => toggle(s.id)}
            className="p-1 rounded hover:bg-muted"
            aria-label="Toggle"
          >
            {s.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
        </div>
      ))}

      {missing.length > 0 && (
        <div className="pt-2 mt-2 border-t border-border">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5 px-1">
            Add section
          </p>
          <div className="flex flex-wrap gap-1">
            {missing.map((t) => (
              <button
                key={t}
                onClick={() => add(t)}
                className="text-[11px] px-2 py-1 rounded-md border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> {sectionTitle(t)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
