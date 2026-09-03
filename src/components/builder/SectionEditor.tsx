import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import type {
  ResumeSection,
  SectionData,
  ProjectItem,
  ExperienceItem,
  EducationItem,
  CertItem,
  ResumeDraft,
} from "@/lib/resumeDraft";
import { ROLE_SKILL_PRESETS, sectionTitle } from "@/lib/resumeDraft";
import { AIRewriteButton } from "./AIRewriteButton";

export function SectionEditor({
  section,
  draft,
  onChange,
}: {
  section: ResumeSection;
  draft: ResumeDraft;
  onChange: (s: ResumeSection) => void;
}) {
  const update = <T,>(data: T) => onChange({ ...section, data: data as never });
  const jd = draft.jobDescription;

  return (
    <div className="dashboard-card animate-fade-in">
      <h3 className="font-heading font-bold text-foreground mb-4">{sectionTitle(section.type)}</h3>

      {section.type === "summary" && (
        <SummaryEditor data={section.data as SectionData["summary"]} onChange={update} jd={jd} role={draft.targetRole} />
      )}
      {section.type === "skills" && (
        <SkillsEditor
          data={section.data as SectionData["skills"]}
          onChange={update}
          role={draft.targetRole}
        />
      )}
      {section.type === "projects" && (
        <ProjectsEditor data={section.data as SectionData["projects"]} onChange={update} jd={jd} />
      )}
      {section.type === "experience" && (
        <ExperienceEditor data={section.data as SectionData["experience"]} onChange={update} jd={jd} />
      )}
      {section.type === "education" && (
        <EducationEditor data={section.data as SectionData["education"]} onChange={update} />
      )}
      {section.type === "certifications" && (
        <CertsEditor data={section.data as SectionData["certifications"]} onChange={update} />
      )}
      {(section.type === "achievements" || section.type === "activities") && (
        <BulletsEditor
          data={section.data as { items: string[] }}
          onChange={update}
          placeholder={section.type === "achievements" ? "e.g. Won 1st place in hackathon" : "e.g. President, Coding Club"}
        />
      )}
    </div>
  );
}

function SummaryEditor({
  data,
  onChange,
  jd,
  role,
}: {
  data: SectionData["summary"];
  onChange: (d: SectionData["summary"]) => void;
  jd?: string;
  role?: string;
}) {
  return (
    <div>
      <Textarea
        value={data.text}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="A 2-3 sentence pitch about who you are, your strongest skills, and the role you're targeting."
        className="min-h-[120px]"
      />
      <div className="flex justify-end mt-2">
        <AIRewriteButton
          text={data.text}
          jobDescription={jd}
          targetRole={role}
          mode="section"
          onResult={(improved) => onChange({ text: improved })}
        />
      </div>
    </div>
  );
}

function SkillsEditor({
  data,
  onChange,
  role,
}: {
  data: SectionData["skills"];
  onChange: (d: SectionData["skills"]) => void;
  role: string;
}) {
  const suggested = (ROLE_SKILL_PRESETS[role] || []).filter((s) => !data.items.includes(s));
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-3 min-h-[2rem]">
        {data.items.map((s) => (
          <span
            key={s}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
          >
            {s}
            <button
              onClick={() => onChange({ items: data.items.filter((i) => i !== s) })}
              className="hover:bg-primary/20 rounded-full"
              aria-label="Remove"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        {data.items.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No skills yet</p>
        )}
      </div>
      <Input
        placeholder="Type a skill and press Enter"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const v = (e.target as HTMLInputElement).value.trim();
            if (v && !data.items.includes(v)) onChange({ items: [...data.items, v] });
            (e.target as HTMLInputElement).value = "";
          }
        }}
      />
      {suggested.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
            Suggested for {role}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggested.map((s) => (
              <button
                key={s}
                onClick={() => onChange({ items: [...data.items, s] })}
                className="text-xs px-2 py-0.5 rounded-full border border-dashed border-border hover:border-primary/50 hover:bg-primary/5 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectsEditor({
  data,
  onChange,
  jd,
}: {
  data: SectionData["projects"];
  onChange: (d: SectionData["projects"]) => void;
  jd?: string;
}) {
  const add = () =>
    onChange({ items: [...data.items, { name: "", tech: "", link: "", bullets: [""] }] });
  const upd = (i: number, p: Partial<ProjectItem>) => {
    const items = [...data.items];
    items[i] = { ...items[i], ...p };
    onChange({ items });
  };
  const remove = (i: number) =>
    onChange({ items: data.items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      {data.items.map((p, i) => (
        <div key={i} className="rounded-xl border border-border p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input placeholder="Project name" value={p.name} onChange={(e) => upd(i, { name: e.target.value })} />
            <Input placeholder="Tech stack (React, Node, ...)" value={p.tech} onChange={(e) => upd(i, { tech: e.target.value })} />
          </div>
          <Input placeholder="Link (optional)" value={p.link || ""} onChange={(e) => upd(i, { link: e.target.value })} />
          <BulletList
            bullets={p.bullets}
            jd={jd}
            onChange={(bullets) => upd(i, { bullets })}
            placeholder="Built X using Y to achieve Z (with metrics)"
          />
          <div className="flex justify-end">
            <button onClick={() => remove(i)} className="text-xs text-destructive hover:underline">
              Remove project
            </button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="w-4 h-4 mr-1" /> Add project
      </Button>
    </div>
  );
}

function ExperienceEditor({
  data,
  onChange,
  jd,
}: {
  data: SectionData["experience"];
  onChange: (d: SectionData["experience"]) => void;
  jd?: string;
}) {
  const add = () =>
    onChange({ items: [...data.items, { role: "", company: "", start: "", end: "", bullets: [""] }] });
  const upd = (i: number, p: Partial<ExperienceItem>) => {
    const items = [...data.items];
    items[i] = { ...items[i], ...p };
    onChange({ items });
  };
  const remove = (i: number) =>
    onChange({ items: data.items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      {data.items.map((e, i) => (
        <div key={i} className="rounded-xl border border-border p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input placeholder="Role" value={e.role} onChange={(ev) => upd(i, { role: ev.target.value })} />
            <Input placeholder="Company" value={e.company} onChange={(ev) => upd(i, { company: ev.target.value })} />
            <Input placeholder="Start (e.g. Jan 2024)" value={e.start} onChange={(ev) => upd(i, { start: ev.target.value })} />
            <Input placeholder="End (e.g. Present)" value={e.end} onChange={(ev) => upd(i, { end: ev.target.value })} />
          </div>
          <BulletList
            bullets={e.bullets}
            jd={jd}
            onChange={(bullets) => upd(i, { bullets })}
            placeholder="Achieved X by doing Y, resulting in Z"
          />
          <div className="flex justify-end">
            <button onClick={() => remove(i)} className="text-xs text-destructive hover:underline">
              Remove role
            </button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="w-4 h-4 mr-1" /> Add role
      </Button>
    </div>
  );
}

function EducationEditor({
  data,
  onChange,
}: {
  data: SectionData["education"];
  onChange: (d: SectionData["education"]) => void;
}) {
  const add = () =>
    onChange({ items: [...data.items, { school: "", degree: "", start: "", end: "", details: "" }] });
  const upd = (i: number, p: Partial<EducationItem>) => {
    const items = [...data.items];
    items[i] = { ...items[i], ...p };
    onChange({ items });
  };
  const remove = (i: number) =>
    onChange({ items: data.items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      {data.items.map((e, i) => (
        <div key={i} className="rounded-xl border border-border p-3 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input placeholder="Degree" value={e.degree} onChange={(ev) => upd(i, { degree: ev.target.value })} />
            <Input placeholder="School" value={e.school} onChange={(ev) => upd(i, { school: ev.target.value })} />
            <Input placeholder="Start year" value={e.start} onChange={(ev) => upd(i, { start: ev.target.value })} />
            <Input placeholder="End year" value={e.end} onChange={(ev) => upd(i, { end: ev.target.value })} />
          </div>
          <Input placeholder="Details (GPA, honors, ...)" value={e.details || ""} onChange={(ev) => upd(i, { details: ev.target.value })} />
          <div className="flex justify-end">
            <button onClick={() => remove(i)} className="text-xs text-destructive hover:underline">
              Remove
            </button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="w-4 h-4 mr-1" /> Add education
      </Button>
    </div>
  );
}

function CertsEditor({
  data,
  onChange,
}: {
  data: SectionData["certifications"];
  onChange: (d: SectionData["certifications"]) => void;
}) {
  const add = () => onChange({ items: [...data.items, { name: "", issuer: "", date: "" }] });
  const upd = (i: number, p: Partial<CertItem>) => {
    const items = [...data.items];
    items[i] = { ...items[i], ...p };
    onChange({ items });
  };
  const remove = (i: number) =>
    onChange({ items: data.items.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      {data.items.map((c, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
          <Input placeholder="Name" value={c.name} onChange={(e) => upd(i, { name: e.target.value })} />
          <Input placeholder="Issuer" value={c.issuer} onChange={(e) => upd(i, { issuer: e.target.value })} />
          <div className="flex gap-2">
            <Input placeholder="Date" value={c.date} onChange={(e) => upd(i, { date: e.target.value })} />
            <button onClick={() => remove(i)} className="text-destructive p-2" aria-label="Remove">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add}>
        <Plus className="w-4 h-4 mr-1" /> Add certification
      </Button>
    </div>
  );
}

function BulletsEditor({
  data,
  onChange,
  placeholder,
}: {
  data: { items: string[] };
  onChange: (d: { items: string[] }) => void;
  placeholder: string;
}) {
  return (
    <BulletList
      bullets={data.items}
      onChange={(items) => onChange({ items })}
      placeholder={placeholder}
    />
  );
}

function BulletList({
  bullets,
  onChange,
  placeholder,
  jd,
}: {
  bullets: string[];
  onChange: (b: string[]) => void;
  placeholder: string;
  jd?: string;
}) {
  const upd = (i: number, v: string) => {
    const b = [...bullets];
    b[i] = v;
    onChange(b);
  };
  return (
    <div className="space-y-2">
      {bullets.map((b, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="text-muted-foreground mt-2">•</span>
          <div className="flex-1">
            <Textarea
              value={b}
              onChange={(e) => upd(i, e.target.value)}
              placeholder={placeholder}
              className="min-h-[60px]"
            />
            <div className="flex justify-between items-center mt-1">
              <button
                onClick={() => onChange(bullets.filter((_, idx) => idx !== i))}
                className="text-[11px] text-muted-foreground hover:text-destructive"
              >
                remove
              </button>
              <AIRewriteButton
                text={b}
                jobDescription={jd}
                mode="bullet"
                onResult={(improved) => upd(i, improved)}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        onClick={() => onChange([...bullets, ""])}
        className="text-xs text-primary hover:underline flex items-center gap-1"
      >
        <Plus className="w-3 h-3" /> Add bullet
      </button>
    </div>
  );
}
