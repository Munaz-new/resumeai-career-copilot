import type { ResumeDraft, ResumeSection, SectionData } from "@/lib/resumeDraft";
import { sectionTitle } from "@/lib/resumeDraft";

export function EditorialCvPreview({ draft, innerRef }: { draft: ResumeDraft; innerRef?: React.Ref<HTMLDivElement> }) {
  const sorted = [...draft.sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const c = draft.contact;
  const summary = sorted.find((s) => s.type === "summary");
  const education = sorted.find((s) => s.type === "education");
  const skills = sorted.find((s) => s.type === "skills");
  const experience = sorted.find((s) => s.type === "experience");
  const sideExtras = sorted.filter((s) => s.type === "achievements" || s.type === "activities");
  const mainSections = sorted.filter((s) => !["summary", "education", "skills", "achievements", "activities", "experience"].includes(s.type));

  return (
    <div ref={innerRef} data-resume-preview className="w-full max-w-[760px] min-h-[1000px] mx-auto bg-white text-zinc-800 shadow-md border border-zinc-200 box-border font-sans overflow-hidden" style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" } as React.CSSProperties}>
      <header className="grid grid-cols-[30%_70%] min-h-[145px]">
        <div className="bg-[#b9b9b9] px-6 py-5 flex flex-col justify-center text-[#303030]">
          <SectionLabel>Contact</SectionLabel>
          <div className="space-y-2 text-[8.5px] leading-[1.35] break-words">
            {c.phone && <p>{c.phone}</p>}
            {c.email && <p>{c.email}</p>}
            {c.location && <p>{c.location}</p>}
            {c.links.map((l) => <p key={l.label}>{l.label}: {l.url}</p>)}
            {!c.phone && !c.email && !c.location && !c.links.length && <p className="text-[#666] italic">Add contact details</p>}
          </div>
        </div>
        <div className="bg-white px-9 py-7 flex flex-col justify-center">
          <h1 className="text-[30px] leading-[0.92] tracking-[0.11em] font-light uppercase text-[#343434] break-words">{c.name || "Your Name"}</h1>
          <p className="mt-2 text-[8px] uppercase tracking-[0.26em] text-[#555]">{draft.targetRole || "Professional Title"}</p>
        </div>
      </header>
      {summary && <div className="bg-[#c9a776] px-6 py-4 text-[#44372a]"><SectionLabel>Summary</SectionLabel><SummaryBody section={summary} /></div>}
      <div className="grid grid-cols-[30%_70%] min-h-[850px]">
        <aside className="bg-[#b9b9b9] px-6 py-5 text-[#303030]">
          {education && <SidebarSection title="Education"><EducationBody section={education} /></SidebarSection>}
          {skills && <SidebarSection title="Skills"><SkillsBody section={skills} /></SidebarSection>}
          {sideExtras.length > 0 && <SidebarSection title="Soft Skills"><SoftSkillsBody sections={sideExtras} /></SidebarSection>}
        </aside>
        <main className="bg-white px-7 py-5 min-w-0">
          {experience && <MainSection title="Work History"><ExperienceBody section={experience} /></MainSection>}
          {mainSections.map((section) => <MainSection key={section.id} title={sectionTitle(section.type)}><GenericBody section={section} /></MainSection>)}
          {!experience && !mainSections.length && <p className="text-[10px] text-zinc-400 italic">Add resume sections to build your CV.</p>}
        </main>
      </div>
    </div>
  );
}
function SectionLabel({ children }: { children: React.ReactNode }) { return <h2 className="text-[9px] uppercase tracking-[0.2em] font-bold mb-2">{children}</h2>; }
function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mb-6 break-inside-avoid"><h2 className="text-[9px] uppercase tracking-[0.2em] font-bold pb-1.5 mb-2 border-b border-[#777]">{title}</h2>{children}</section>; }
function MainSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="mb-6 break-inside-avoid"><h2 className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#383838] pb-1.5 mb-3 border-b border-[#9c9c9c]">{title}</h2>{children}</section>; }
function SummaryBody({ section }: { section: ResumeSection }) { const d = section.data as SectionData["summary"]; return <p className="text-[8.5px] leading-[1.5] text-[#4b4035]">{d.text || <span className="italic text-[#6b5a49]">Add your professional summary...</span>}</p>; }
function EducationBody({ section }: { section: ResumeSection }) { const d = section.data as SectionData["education"]; if (!d.items.length) return <p className="text-[8.5px] italic text-[#666]">Add education</p>; return <div className="space-y-3">{d.items.map((e, i) => <div key={i} className="text-[8.5px] leading-[1.4]"><p className="font-bold uppercase text-[8.5px]">{e.school}</p><p>{e.degree}</p><p className="text-[#555]">{e.start} – {e.end}</p>{e.details && <p className="mt-0.5">{e.details}</p>}</div>)}</div>; }
function SkillsBody({ section }: { section: ResumeSection }) { const d = section.data as SectionData["skills"]; if (!d.items.length) return <p className="text-[8.5px] italic text-[#666]">Add skills</p>; return <ul className="space-y-1.5 text-[8.5px] leading-[1.35]">{d.items.map((skill) => <li key={skill} className="pl-2 -indent-2">• {skill}</li>)}</ul>; }
function SoftSkillsBody({ sections }: { sections: ResumeSection[] }) { const items = sections.flatMap((s) => (s.data as { items: string[] }).items).filter(Boolean); if (!items.length) return <p className="text-[8.5px] italic text-[#666]">Add strengths</p>; return <ul className="space-y-1.5 text-[8.5px] leading-[1.35]">{items.map((item, i) => <li key={i} className="pl-2 -indent-2">• {item}</li>)}</ul>; }
function ExperienceBody({ section }: { section: ResumeSection }) { const d = section.data as SectionData["experience"]; if (!d.items.length) return <p className="text-[9px] italic text-zinc-400">Add work history</p>; return <div className="space-y-5">{d.items.map((e, i) => <article key={i}><div className="flex justify-between gap-3 items-baseline"><div className="min-w-0"><p className="font-bold text-[9.5px] uppercase tracking-[0.04em] text-[#343434]">{e.role}</p><p className="text-[8.5px] text-[#555]">{e.company}</p></div><p className="shrink-0 text-[8px] text-[#666]">{e.start} – {e.end}</p></div><ul className="mt-1.5 space-y-1">{e.bullets.filter(Boolean).map((b, j) => <li key={j} className="text-[8.5px] leading-[1.45] text-[#4a4a4a] pl-2.5 -indent-2.5">• {b}</li>)}</ul></article>)}</div>; }
function GenericBody({ section }: { section: ResumeSection }) { const text = "text-[9px] leading-[1.45] text-[#4a4a4a]"; switch (section.type) { case "projects": { const d = section.data as SectionData["projects"]; return d.items.length ? <div className="space-y-3">{d.items.map((p, i) => <article key={i}><div className="flex justify-between gap-3"><p className="font-bold text-[9.5px]">{p.name}</p><p className="text-[8px] text-[#666]">{p.tech}</p></div>{p.link && <p className="text-[7.5px] text-[#777] break-all">{p.link}</p>}<ul className="mt-1">{p.bullets.filter(Boolean).map((b, j) => <li key={j} className={text}>• {b}</li>)}</ul></article>)}</div> : <Placeholder text="Add a project" />; } case "certifications": { const d = section.data as SectionData["certifications"]; return d.items.length ? <ul className="space-y-1.5">{d.items.map((c, i) => <li key={i} className={text}><strong>{c.name}</strong> — {c.issuer}{c.date ? ` (${c.date})` : ""}</li>)}</ul> : <Placeholder text="Add certifications" />; } default: return <Placeholder text={`Add ${sectionTitle(section.type).toLowerCase()}`} />; } }
function Placeholder({ text }: { text: string }) { return <span className="text-[9px] italic text-zinc-400">{text}</span>; }
