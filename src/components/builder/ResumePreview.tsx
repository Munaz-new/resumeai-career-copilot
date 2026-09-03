import type { ResumeDraft, ResumeSection, SectionData, TemplateId } from "@/lib/resumeDraft";
import { sectionTitle } from "@/lib/resumeDraft";
import { cn } from "@/lib/utils";

const TEMPLATE_STYLES: Record<TemplateId, {
  accent: string;
  headerAlign: "left" | "center";
  rule: string;
  font: string;
}> = {
  "ats-pro": { accent: "text-zinc-900", headerAlign: "left", rule: "border-zinc-900", font: "font-sans" },
  "fresher-tech": { accent: "text-blue-700", headerAlign: "center", rule: "border-blue-700", font: "font-sans" },
  "modern-pro": { accent: "text-zinc-800", headerAlign: "left", rule: "border-zinc-300", font: "font-sans" },
  "creative-tech": { accent: "text-violet-700", headerAlign: "left", rule: "border-violet-700", font: "font-sans" },
};

export function ResumePreview({ draft, innerRef }: { draft: ResumeDraft; innerRef?: React.Ref<HTMLDivElement> }) {
  const t = TEMPLATE_STYLES[draft.template];
  const sorted = [...draft.sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const c = draft.contact;

  return (
    <div
      ref={innerRef}
      data-resume-preview
      style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}
      className={cn(
        "bg-white text-zinc-900 shadow-md rounded-md mx-auto",
        "w-full max-w-[760px] min-h-[1000px] p-10",
        t.font
      )}
    >

      <header className={cn("pb-3 mb-4 border-b-2", t.rule, t.headerAlign === "center" && "text-center")}>
        <h1 className={cn("text-2xl font-bold tracking-tight", t.accent)}>
          {c.name || "Your Name"}
        </h1>
        <p className="text-xs text-zinc-600 mt-1">
          {[c.email, c.phone, c.location].filter(Boolean).join("  •  ") || "email@example.com  •  phone  •  location"}
        </p>
        {c.links.length > 0 && (
          <p className="text-xs text-zinc-600 mt-0.5">
            {c.links.map((l) => `${l.label}: ${l.url}`).join("  •  ")}
          </p>
        )}
      </header>

      {sorted.map((s) => (
        <section key={s.id} className="mb-4 break-inside-avoid">
          <h2 className={cn("text-[11px] uppercase tracking-widest font-bold pb-1 mb-2 border-b", t.rule, t.accent)}>
            {sectionTitle(s.type)}
          </h2>
          <SectionBody section={s} />
        </section>
      ))}
    </div>
  );
}

function SectionBody({ section }: { section: ResumeSection }) {
  switch (section.type) {
    case "summary": {
      const d = section.data as SectionData["summary"];
      return <p className="text-[12.5px] leading-relaxed text-zinc-800">{d.text || <Placeholder text="Your summary..." />}</p>;
    }
    case "skills": {
      const d = section.data as SectionData["skills"];
      if (!d.items.length) return <Placeholder text="Add some skills" />;
      return <p className="text-[12.5px] text-zinc-800">{d.items.join(" • ")}</p>;
    }
    case "projects": {
      const d = section.data as SectionData["projects"];
      if (!d.items.length) return <Placeholder text="Add a project" />;
      return (
        <div className="space-y-3">
          {d.items.map((p, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline">
                <p className="text-[12.5px] font-semibold text-zinc-900">{p.name || "Project"}</p>
                <p className="text-[11px] text-zinc-600">{p.tech}</p>
              </div>
              {p.link && <p className="text-[11px] text-zinc-600">{p.link}</p>}
              <ul className="mt-1 space-y-0.5">
                {p.bullets.filter(Boolean).map((b, j) => (
                  <li key={j} className="text-[12px] text-zinc-800 pl-3 -indent-3">• {b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }
    case "experience": {
      const d = section.data as SectionData["experience"];
      if (!d.items.length) return <Placeholder text="Add experience" />;
      return (
        <div className="space-y-3">
          {d.items.map((e, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline">
                <p className="text-[12.5px] font-semibold text-zinc-900">{e.role} <span className="font-normal text-zinc-700">— {e.company}</span></p>
                <p className="text-[11px] text-zinc-600">{e.start} – {e.end}</p>
              </div>
              <ul className="mt-1 space-y-0.5">
                {e.bullets.filter(Boolean).map((b, j) => (
                  <li key={j} className="text-[12px] text-zinc-800 pl-3 -indent-3">• {b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }
    case "education": {
      const d = section.data as SectionData["education"];
      if (!d.items.length) return <Placeholder text="Add education" />;
      return (
        <div className="space-y-2">
          {d.items.map((e, i) => (
            <div key={i} className="flex justify-between items-baseline">
              <div>
                <p className="text-[12.5px] font-semibold text-zinc-900">{e.degree}</p>
                <p className="text-[11.5px] text-zinc-700">{e.school}{e.details ? ` — ${e.details}` : ""}</p>
              </div>
              <p className="text-[11px] text-zinc-600">{e.start} – {e.end}</p>
            </div>
          ))}
        </div>
      );
    }
    case "certifications": {
      const d = section.data as SectionData["certifications"];
      if (!d.items.length) return <Placeholder text="Add certifications" />;
      return (
        <ul className="space-y-1">
          {d.items.map((c, i) => (
            <li key={i} className="text-[12px] text-zinc-800 flex justify-between">
              <span><span className="font-semibold">{c.name}</span> — {c.issuer}</span>
              <span className="text-zinc-600">{c.date}</span>
            </li>
          ))}
        </ul>
      );
    }
    case "achievements":
    case "activities": {
      const d = section.data as { items: string[] };
      if (!d.items.length) return <Placeholder text="Add items" />;
      return (
        <ul className="space-y-0.5">
          {d.items.filter(Boolean).map((b, i) => (
            <li key={i} className="text-[12px] text-zinc-800 pl-3 -indent-3">• {b}</li>
          ))}
        </ul>
      );
    }
  }
}

function Placeholder({ text }: { text: string }) {
  return <span className="text-[12px] italic text-zinc-400">{text}</span>;
}
