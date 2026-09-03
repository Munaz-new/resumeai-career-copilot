// Resume Builder draft model + persistence

export type ProfileType = "student" | "fresher" | "experienced" | "switcher";
export type ExpLevel = "none" | "internship" | "beginner" | "experienced";
export type TemplateId = "ats-pro" | "fresher-tech" | "modern-pro" | "creative-tech";
export type SectionType =
  | "summary"
  | "skills"
  | "projects"
  | "experience"
  | "education"
  | "certifications"
  | "achievements"
  | "activities";

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: { label: string; url: string }[];
}

export interface ProjectItem {
  name: string;
  tech: string;
  link?: string;
  bullets: string[];
}
export interface ExperienceItem {
  role: string;
  company: string;
  start: string;
  end: string;
  bullets: string[];
}
export interface EducationItem {
  school: string;
  degree: string;
  start: string;
  end: string;
  details?: string;
}
export interface CertItem {
  name: string;
  issuer: string;
  date: string;
}

export interface SectionData {
  summary: { text: string };
  skills: { items: string[] };
  projects: { items: ProjectItem[] };
  experience: { items: ExperienceItem[] };
  education: { items: EducationItem[] };
  certifications: { items: CertItem[] };
  achievements: { items: string[] };
  activities: { items: string[] };
}

export interface ResumeSection<T extends SectionType = SectionType> {
  id: string;
  type: T;
  enabled: boolean;
  order: number;
  data: SectionData[T];
}

export interface ResumeDraft {
  profile: ProfileType;
  targetRole: string;
  level: ExpLevel;
  jobDescription?: string;
  template: TemplateId;
  contact: ContactInfo;
  sections: ResumeSection[];
  wizardComplete: boolean;
}

const KEY = "resumeai.builder.draft.v1";

export function loadDraft(): ResumeDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ResumeDraft) : null;
  } catch {
    return null;
  }
}

export function saveDraft(d: ResumeDraft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* quota */
  }
}

export function clearDraft(): void {
  localStorage.removeItem(KEY);
}

// ------- Role + section recommendations -------

export const TARGET_ROLES = [
  "Software Developer",
  "Frontend Developer",
  "Full Stack Developer",
  "AI & Data Science",
  "Cybersecurity",
  "UI/UX Designer",
  "Data Analyst",
  "Business Analyst",
] as const;

export const ROLE_SKILL_PRESETS: Record<string, string[]> = {
  "Software Developer": ["Java", "Python", "Git", "Data Structures", "SQL", "REST API", "OOP"],
  "Frontend Developer": ["React", "JavaScript", "TypeScript", "HTML", "CSS", "REST API", "Git", "Tailwind"],
  "Full Stack Developer": ["React", "Node.js", "Express", "MongoDB", "REST API", "Git", "TypeScript", "Docker"],
  "AI & Data Science": ["Python", "Machine Learning", "Pandas", "NumPy", "SQL", "TensorFlow", "Scikit-learn"],
  "Cybersecurity": ["Linux", "Networking", "Kali Linux", "Vulnerability Assessment", "Python", "Wireshark"],
  "UI/UX Designer": ["Figma", "Adobe XD", "Wireframing", "Prototyping", "User Research", "Design Systems"],
  "Data Analyst": ["SQL", "Excel", "Tableau", "Power BI", "Python", "Pandas", "Data Visualization"],
  "Business Analyst": ["SQL", "Excel", "Power BI", "Requirements Gathering", "Stakeholder Management", "Agile"],
};

export function recommendSections(profile: ProfileType): SectionType[] {
  if (profile === "experienced" || profile === "switcher") {
    return ["summary", "experience", "projects", "skills", "certifications", "education"];
  }
  return ["summary", "skills", "projects", "education", "certifications", "achievements", "activities"];
}

export function newSection<T extends SectionType>(type: T, order: number): ResumeSection<T> {
  const empty: SectionData = {
    summary: { text: "" },
    skills: { items: [] },
    projects: { items: [] },
    experience: { items: [] },
    education: { items: [] },
    certifications: { items: [] },
    achievements: { items: [] },
    activities: { items: [] },
  };
  return {
    id: `${type}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    enabled: true,
    order,
    data: empty[type] as SectionData[T],
  };
}

export function createEmptyDraft(): ResumeDraft {
  return {
    profile: "fresher",
    targetRole: "",
    level: "none",
    template: "ats-pro",
    contact: { name: "", email: "", phone: "", location: "", links: [] },
    sections: [],
    wizardComplete: false,
  };
}

export function initSectionsFor(profile: ProfileType, role: string): ResumeSection[] {
  const types = recommendSections(profile);
  const sections = types.map((t, i) => newSection(t, i));
  // pre-seed skills with role preset if available
  const skillsSection = sections.find((s) => s.type === "skills") as ResumeSection<"skills"> | undefined;
  if (skillsSection && ROLE_SKILL_PRESETS[role]) {
    skillsSection.data.items = [...ROLE_SKILL_PRESETS[role]];
  }
  return sections;
}

// ------- Convert draft to plain text for analyzer -------

export function draftToPlainText(d: ResumeDraft): string {
  const out: string[] = [];
  const c = d.contact;
  if (c.name) out.push(c.name);
  const contactBits = [c.email, c.phone, c.location].filter(Boolean).join(" | ");
  if (contactBits) out.push(contactBits);
  if (c.links.length) out.push(c.links.map((l) => `${l.label}: ${l.url}`).join(" | "));
  out.push("");

  const sorted = [...d.sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  for (const s of sorted) {
    out.push(sectionTitle(s.type).toUpperCase());
    out.push(sectionBody(s));
    out.push("");
  }
  return out.join("\n");
}

export function sectionTitle(t: SectionType): string {
  return {
    summary: "Professional Summary",
    skills: "Skills",
    projects: "Projects",
    experience: "Experience",
    education: "Education",
    certifications: "Certifications",
    achievements: "Achievements",
    activities: "Activities",
  }[t];
}

function sectionBody(s: ResumeSection): string {
  switch (s.type) {
    case "summary":
      return (s.data as SectionData["summary"]).text;
    case "skills":
      return (s.data as SectionData["skills"]).items.join(", ");
    case "projects":
      return (s.data as SectionData["projects"]).items
        .map((p) => `${p.name} — ${p.tech}\n${p.bullets.map((b) => "• " + b).join("\n")}`)
        .join("\n\n");
    case "experience":
      return (s.data as SectionData["experience"]).items
        .map(
          (e) =>
            `${e.role} | ${e.company} (${e.start} - ${e.end})\n${e.bullets.map((b) => "• " + b).join("\n")}`
        )
        .join("\n\n");
    case "education":
      return (s.data as SectionData["education"]).items
        .map((e) => `${e.degree}, ${e.school} (${e.start} - ${e.end})${e.details ? "\n" + e.details : ""}`)
        .join("\n");
    case "certifications":
      return (s.data as SectionData["certifications"]).items
        .map((c) => `${c.name} — ${c.issuer} (${c.date})`)
        .join("\n");
    case "achievements":
    case "activities":
      return (s.data as { items: string[] }).items.map((i) => "• " + i).join("\n");
  }
}
