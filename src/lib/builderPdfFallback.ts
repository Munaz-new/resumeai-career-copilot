import jsPDF from "jspdf";
import type { ResumeDraft, ResumeSection, SectionData, TemplateId } from "./resumeDraft";
import { sectionTitle } from "./resumeDraft";

const ACCENT: Record<TemplateId, [number, number, number]> = {
  "ats-pro": [17, 24, 39],
  "fresher-tech": [29, 78, 216],
  "modern-pro": [39, 39, 42],
  "creative-tech": [13, 107, 99],
};

const SIDEBAR: [number, number, number] = [15, 105, 97];
const LIGHT_TEAL: [number, number, number] = [220, 247, 243];
const DARK: [number, number, number] = [24, 24, 27];
const MUTED: [number, number, number] = [82, 82, 91];

/**
 * Safe text-based PDF export. Used as a fallback when the WYSIWYG
 * (html2canvas) export throws, so the user always gets a PDF.
 */
export function exportResumePdfSafe(draft: ResumeDraft) {
  if (draft.template === "creative-tech") {
    exportOnePageResumePdf(draft);
    return;
  }

  const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxW = pageW - margin * 2;
  const accent = ACCENT[draft.template] ?? ACCENT["ats-pro"];
  let y = margin;

  const ensure = (need: number) => {
    if (y + need > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeLines = (text: string, size: number, bold = false, color: [number, number, number] = DARK, indent = 0) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(text, maxW - indent);
    for (const line of lines) {
      ensure(size + 2);
      doc.text(line, margin + indent, y);
      y += size + 2;
    }
  };

  const c = draft.contact;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(c.name || "Your Name", margin, y);
  y += 24;

  const contactLine = [c.email, c.phone, c.location].filter(Boolean).join("  •  ");
  if (contactLine) writeLines(contactLine, 10, false, [80, 80, 80]);
  if (c.links.length > 0) writeLines(c.links.map((l) => `${l.label}: ${l.url}`).join("  •  "), 10, false, [80, 80, 80]);

  y += 4;
  doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.setLineWidth(1.2);
  doc.line(margin, y, pageW - margin, y);
  y += 14;

  const sorted = [...draft.sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  for (const s of sorted) {
    ensure(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(accent[0], accent[1], accent[2]);
    doc.text(sectionTitle(s.type).toUpperCase(), margin, y);
    y += 4;
    doc.setDrawColor(accent[0], accent[1], accent[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    y += 12;
    renderSection(s, writeLines, ensure);
    y += 8;
  }

  const name = (draft.contact.name || "draft").replace(/\s+/g, "_");
  doc.save(`Resume-${name}.pdf`);
}

function exportOnePageResumePdf(draft: ResumeDraft) {
  const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const sidebarW = 190;
  const mainX = 42;
  const mainW = pageW - sidebarW - 72;
  const sidebarX = pageW - sidebarW;
  const c = draft.contact;
  const sorted = [...draft.sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const mainSections = sorted.filter((s) => !["skills", "achievements", "activities"].includes(s.type));
  const skills = sorted.find((s) => s.type === "skills");
  const achievements = sorted.filter((s) => s.type === "achievements");
  const activities = sorted.filter((s) => s.type === "activities");

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setDrawColor(228, 228, 231);
  doc.setLineWidth(0.7);
  doc.rect(18, 18, pageW - 36, pageH - 36, "S");

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(13, 107, 99);
  doc.setCharSpace(1.8);
  doc.text((draft.targetRole || "Professional Profile").toUpperCase(), mainX, 48);
  doc.setCharSpace(0);
  doc.setFontSize(25);
  doc.setTextColor(...DARK);
  doc.text(c.name || "Your Name", mainX, 75);

  const contactLine = [c.email, c.phone, c.location].filter(Boolean).join("  •  ");
  if (contactLine) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(doc.splitTextToSize(contactLine, mainW - 10), mainX, 94);
  }
  if (c.links.length > 0) {
    doc.setFontSize(8);
    const links = c.links.map((l) => `${l.label}: ${l.url}`).join("  •  ");
    doc.text(doc.splitTextToSize(links, mainW - 10), mainX, 108);
  }

  // Initials badge, matching the live fallback-safe preview.
  const initials = (c.name || "Your Name").split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();
  const cx = pageW - sidebarW - 50;
  doc.setFillColor(...LIGHT_TEAL);
  doc.circle(cx, 73, 31, "F");
  doc.setFillColor(...SIDEBAR);
  doc.circle(cx, 73, 26, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(initials || "N", cx, 79, { align: "center" });

  const contentTop = 132;
  doc.setDrawColor(228, 228, 231);
  doc.line(18, contentTop, pageW - 18, contentTop);

  // Sidebar
  doc.setFillColor(...SIDEBAR);
  doc.rect(sidebarX, contentTop, sidebarW, pageH - contentTop - 18, "F");

  // Main column
  let y = contentTop + 28;
  const sectionHeading = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...SIDEBAR);
    doc.setCharSpace(1.4);
    doc.text(title.toUpperCase(), mainX, y);
    doc.setCharSpace(0);
    y += 5;
    doc.setDrawColor(...SIDEBAR);
    doc.setLineWidth(0.7);
    doc.line(mainX, y, mainX + 46, y);
    y += 13;
  };

  for (const s of mainSections) {
    if (y > pageH - 95) break;
    sectionHeading(sectionTitle(s.type));
    y = renderOnePageMainSection(doc, s, mainX, mainW, y);
    y += 14;
  }

  let sy = contentTop + 28;
  const sideX = sidebarX + 18;
  const sideW = sidebarW - 36;
  const sideHeading = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...LIGHT_TEAL);
    doc.setCharSpace(1.5);
    doc.text(title.toUpperCase(), sideX, sy);
    doc.setCharSpace(0);
    sy += 5;
    doc.setDrawColor(70, 150, 144);
    doc.setLineWidth(0.5);
    doc.line(sideX, sy, sidebarX + sidebarW - 18, sy);
    sy += 14;
  };

  sideHeading("Skills");
  if (skills) {
    const d = skills.data as SectionData["skills"];
    let x = sideX;
    for (const skill of d.items) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      const w = doc.getTextWidth(skill) + 14;
      if (x + w > sidebarX + sidebarW - 18) { x = sideX; sy += 17; }
      doc.setDrawColor(82, 161, 154);
      doc.roundedRect(x, sy - 9, Math.min(w, sideW), 14, 7, 7, "S");
      doc.setTextColor(245, 250, 249);
      doc.text(skill, x + 7, sy);
      x += Math.min(w, sideW) + 4;
    }
    sy += 25;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(190, 220, 217);
    doc.text("Add skills", sideX, sy);
    sy += 22;
  }

  const sideList = (title: string, sections: ResumeSection[]) => {
    for (const section of sections) {
      sideHeading(title);
      const d = section.data as { items: string[] };
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(240, 248, 247);
      for (const item of d.items.filter(Boolean)) {
        const lines = doc.splitTextToSize(`• ${item}`, sideW);
        for (const line of lines) { doc.text(line, sideX, sy); sy += 11; }
        sy += 2;
      }
      sy += 7;
    }
  };

  sideList("Strengths", achievements);
  sideList("Additional", activities);

  if (c.links.length > 0) {
    sideHeading("Links");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(240, 248, 247);
    for (const link of c.links) {
      const lines = doc.splitTextToSize(`${link.label}: ${link.url}`, sideW);
      for (const line of lines) { doc.text(line, sideX, sy); sy += 10; }
      sy += 2;
    }
  }

  const name = (c.name || "draft").replace(/\s+/g, "_");
  doc.save(`Resume-${name}.pdf`);
}

function renderOnePageMainSection(doc: jsPDF, s: ResumeSection, x: number, width: number, y: number): number {
  const text = (value: string, size = 8.5, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(value, width);
    for (const line of lines) { doc.text(line, x, y); y += size * 1.35; }
  };

  switch (s.type) {
    case "summary": {
      const d = s.data as SectionData["summary"];
      if (d.text) text(d.text, 8.5);
      else { doc.setFont("helvetica", "italic"); doc.setFontSize(8.5); doc.setTextColor(161, 161, 170); doc.text("Your summary...", x, y); y += 12; }
      break;
    }
    case "projects": {
      const d = s.data as SectionData["projects"];
      if (!d.items.length) { doc.setFont("helvetica", "italic"); doc.setFontSize(8.5); doc.setTextColor(161, 161, 170); doc.text("Add a project", x, y); y += 12; break; }
      for (const p of d.items) {
        text(p.name || "Project", 8.5, true);
        if (p.tech) text(p.tech, 7.5);
        if (p.link) text(p.link, 7.5);
        for (const b of p.bullets.filter(Boolean)) text(`• ${b}`, 8.2);
        y += 4;
      }
      break;
    }
    case "experience": {
      const d = s.data as SectionData["experience"];
      if (!d.items.length) { doc.setFont("helvetica", "italic"); doc.setFontSize(8.5); doc.setTextColor(161, 161, 170); doc.text("Add experience", x, y); y += 12; break; }
      for (const e of d.items) {
        text(`${e.role} — ${e.company}`, 8.5, true);
        text(`${e.start} – ${e.end}`, 7.5);
        for (const b of e.bullets.filter(Boolean)) text(`• ${b}`, 8.2);
        y += 4;
      }
      break;
    }
    case "education": {
      const d = s.data as SectionData["education"];
      if (!d.items.length) { doc.setFont("helvetica", "italic"); doc.setFontSize(8.5); doc.setTextColor(161, 161, 170); doc.text("Add education", x, y); y += 12; break; }
      for (const e of d.items) {
        text(e.degree, 8.5, true);
        text(`${e.school}${e.details ? ` — ${e.details}` : ""}`, 7.8);
        text(`${e.start} – ${e.end}`, 7.5);
        y += 3;
      }
      break;
    }
    case "certifications": {
      const d = s.data as SectionData["certifications"];
      if (!d.items.length) { doc.setFont("helvetica", "italic"); doc.setFontSize(8.5); doc.setTextColor(161, 161, 170); doc.text("Add certifications", x, y); y += 12; break; }
      for (const it of d.items) { text(`${it.name} — ${it.issuer}`, 8.2, true); text(it.date, 7.5); y += 3; }
      break;
    }
  }
  return y;
}

function renderSection(
  s: ResumeSection,
  writeLines: (t: string, size: number, bold?: boolean, color?: [number, number, number], indent?: number) => void,
  _ensure: (n: number) => void
) {
  switch (s.type) {
    case "summary": {
      const d = s.data as SectionData["summary"];
      if (d.text) writeLines(d.text, 10.5);
      break;
    }
    case "skills": {
      const d = s.data as SectionData["skills"];
      if (d.items.length) writeLines(d.items.join(" • "), 10.5);
      break;
    }
    case "projects": {
      const d = s.data as SectionData["projects"];
      for (const p of d.items) {
        writeLines(`${p.name}${p.tech ? `  —  ${p.tech}` : ""}`, 11, true, DARK);
        if (p.link) writeLines(p.link, 9.5, false, [80, 80, 80]);
        for (const b of p.bullets.filter(Boolean)) writeLines(`• ${b}`, 10, false, DARK, 8);
      }
      break;
    }
    case "experience": {
      const d = s.data as SectionData["experience"];
      for (const e of d.items) {
        writeLines(`${e.role} — ${e.company}    ${e.start} – ${e.end}`, 11, true, DARK);
        for (const b of e.bullets.filter(Boolean)) writeLines(`• ${b}`, 10, false, DARK, 8);
      }
      break;
    }
    case "education": {
      const d = s.data as SectionData["education"];
      for (const e of d.items) {
        writeLines(`${e.degree} — ${e.school}    ${e.start} – ${e.end}`, 11, true, DARK);
        if (e.details) writeLines(e.details, 10, false, [70, 70, 70], 8);
      }
      break;
    }
    case "certifications": {
      const d = s.data as SectionData["certifications"];
      for (const it of d.items) writeLines(`${it.name} — ${it.issuer}    ${it.date}`, 10);
      break;
    }
    case "achievements":
    case "activities": {
      const d = s.data as { items: string[] };
      for (const b of d.items.filter(Boolean)) writeLines(`• ${b}`, 10, false, DARK, 8);
      break;
    }
  }
}
