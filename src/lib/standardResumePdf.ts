import jsPDF from "jspdf";
import type { ResumeDraft, ResumeSection, SectionData, TemplateId } from "./resumeDraft";
import { sectionTitle } from "./resumeDraft";

const ACCENT: Partial<Record<TemplateId, [number, number, number]>> = {
  "ats-pro": [17, 24, 39],
  "fresher-tech": [29, 78, 216],
  "modern-pro": [39, 39, 42],
  "creative-tech": [13, 107, 99],
};

const DARK: [number, number, number] = [24, 24, 27];
const MUTED: [number, number, number] = [82, 82, 91];

function drawWrapped(doc: jsPDF, text: string, x: number, y: number, width: number, size: number, color: [number, number, number] = DARK, bold = false, leading = 1.45) {
  if (!text?.trim()) return y;
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...color);
  const lines = doc.splitTextToSize(text, width) as string[];
  for (const line of lines) {
    doc.text(line, x, y);
    y += size * leading;
  }
  return y;
}

function drawBullets(doc: jsPDF, items: string[], x: number, y: number, width: number) {
  for (const item of items.filter(Boolean)) {
    y = drawWrapped(doc, `• ${item}`, x, y, width, 10, DARK, false, 1.45);
    y += 2;
  }
  return y;
}

function drawHeading(doc: jsPDF, title: string, x: number, y: number, width: number, accent: [number, number, number]) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...accent);
  doc.setCharSpace(1.1);
  doc.text(title.toUpperCase(), x, y);
  doc.setCharSpace(0);
  doc.setDrawColor(...accent);
  doc.setLineWidth(0.55);
  doc.line(x, y + 5, x + width, y + 5);
  return y + 21;
}

function drawExperience(doc: jsPDF, data: SectionData["experience"], x: number, y: number, width: number) {
  for (const item of data.items) {
    const title = [item.role, item.company].filter(Boolean).join(" — ");
    y = drawWrapped(doc, title, x, y, width, 10.5, DARK, true, 1.4);
    y = drawWrapped(doc, `${item.start} – ${item.end}`, x, y + 1, width, 8.5, MUTED, false, 1.45);
    y = drawBullets(doc, item.bullets, x + 6, y + 2, width - 6);
    y += 7;
  }
  return y;
}

function drawProjects(doc: jsPDF, data: SectionData["projects"], x: number, y: number, width: number) {
  for (const item of data.items) {
    y = drawWrapped(doc, item.name || "Project", x, y, width, 10.5, DARK, true, 1.4);
    if (item.tech) y = drawWrapped(doc, item.tech, x, y + 1, width, 8.5, MUTED, false, 1.4);
    if (item.link) y = drawWrapped(doc, item.link, x, y + 1, width, 8.2, MUTED, false, 1.4);
    y = drawBullets(doc, item.bullets, x + 6, y + 2, width - 6);
    y += 7;
  }
  return y;
}

function drawEducation(doc: jsPDF, data: SectionData["education"], x: number, y: number, width: number) {
  for (const item of data.items) {
    y = drawWrapped(doc, item.degree || "Education", x, y, width, 10.5, DARK, true, 1.4);
    y = drawWrapped(doc, item.school, x, y + 1, width, 9, MUTED, false, 1.4);
    y = drawWrapped(doc, `${item.start} – ${item.end}`, x, y + 1, width, 8.3, MUTED, false, 1.4);
    if (item.details) y = drawWrapped(doc, item.details, x, y + 1, width, 8.3, MUTED, false, 1.4);
    y += 7;
  }
  return y;
}

function drawSectionBody(doc: jsPDF, section: ResumeSection, x: number, y: number, width: number) {
  switch (section.type) {
    case "summary": {
      const d = section.data as SectionData["summary"];
      return drawWrapped(doc, d.text, x, y, width, 10, DARK, false, 1.5) + 8;
    }
    case "skills": {
      const d = section.data as SectionData["skills"];
      return drawBullets(doc, d.items, x + 4, y, width - 4) + 7;
    }
    case "experience": return drawExperience(doc, section.data as SectionData["experience"], x, y, width);
    case "projects": return drawProjects(doc, section.data as SectionData["projects"], x, y, width);
    case "education": return drawEducation(doc, section.data as SectionData["education"], x, y, width);
    case "certifications": {
      const d = section.data as SectionData["certifications"];
      let next = y;
      for (const item of d.items) {
        next = drawWrapped(doc, item.name, x, next, width, 9.5, DARK, true, 1.4);
        next = drawWrapped(doc, [item.issuer, item.date].filter(Boolean).join(" — "), x, next + 1, width, 8.5, MUTED, false, 1.4) + 6;
      }
      return next;
    }
    case "achievements":
    case "activities": {
      const d = section.data as { items: string[] };
      return drawBullets(doc, d.items, x + 4, y, width - 4) + 7;
    }
  }
}

export function exportStandardResumePdf(draft: ResumeDraft) {
  const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageW - margin * 2;
  const accent = ACCENT[draft.template] ?? ACCENT["ats-pro"];
  let y = margin;

  const ensureSection = (minimum: number) => {
    if (y + minimum > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const c = draft.contact;
  y = drawWrapped(doc, c.name || "Your Name", margin, y, contentWidth, 22, accent, true, 1.15) + 5;

  const contact = [c.email, c.phone, c.location].filter(Boolean).join("  •  ");
  if (contact) y = drawWrapped(doc, contact, margin, y, contentWidth, 9.5, MUTED, false, 1.45);
  if (c.links.length) y = drawWrapped(doc, c.links.map((l) => `${l.label}: ${l.url}`).join("  •  "), margin, y + 1, contentWidth, 9, MUTED, false, 1.45);

  y += 5;
  doc.setDrawColor(...accent);
  doc.setLineWidth(1.1);
  doc.line(margin, y, pageW - margin, y);
  y += 20;

  const sections = [...draft.sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  for (const section of sections) {
    ensureSection(45);
    y = drawHeading(doc, sectionTitle(section.type), margin, y, contentWidth, accent);
    const before = y;
    y = drawSectionBody(doc, section, margin, y, contentWidth);
    if (y <= before) y = before + 12;
    y += 5;
  }

  const fileName = (c.name || "draft").trim().replace(/\s+/g, "_");
  doc.save(`Resume-${fileName}.pdf`);
}
