import jsPDF from "jspdf";
import type { ResumeDraft, ResumeSection, SectionData, TemplateId } from "./resumeDraft";
import { sectionTitle } from "./resumeDraft";

const ACCENT: Record<TemplateId, [number, number, number]> = {
  "ats-pro": [17, 24, 39],
  "fresher-tech": [29, 78, 216],
  "modern-pro": [39, 39, 42],
  "creative-tech": [109, 40, 217],
};

/**
 * Safe text-based PDF export. Used as a fallback when the WYSIWYG
 * (html2canvas) export throws — guarantees the user always gets a PDF.
 */
export function exportResumePdfSafe(draft: ResumeDraft) {
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

  const writeLines = (text: string, size: number, bold = false, color: [number, number, number] = [30, 30, 30], indent = 0) => {
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

  // Header
  const c = draft.contact;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(accent[0], accent[1], accent[2]);
  doc.text(c.name || "Your Name", margin, y);
  y += 24;

  const contactLine = [c.email, c.phone, c.location].filter(Boolean).join("  •  ");
  if (contactLine) writeLines(contactLine, 10, false, [80, 80, 80]);
  if (c.links.length > 0) {
    writeLines(c.links.map((l) => `${l.label}: ${l.url}`).join("  •  "), 10, false, [80, 80, 80]);
  }

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
        writeLines(`${p.name}${p.tech ? `  —  ${p.tech}` : ""}`, 11, true, [20, 20, 20]);
        if (p.link) writeLines(p.link, 9.5, false, [80, 80, 80]);
        for (const b of p.bullets.filter(Boolean)) writeLines(`• ${b}`, 10, false, [30, 30, 30], 8);
      }
      break;
    }
    case "experience": {
      const d = s.data as SectionData["experience"];
      for (const e of d.items) {
        writeLines(`${e.role} — ${e.company}    ${e.start} – ${e.end}`, 11, true, [20, 20, 20]);
        for (const b of e.bullets.filter(Boolean)) writeLines(`• ${b}`, 10, false, [30, 30, 30], 8);
      }
      break;
    }
    case "education": {
      const d = s.data as SectionData["education"];
      for (const e of d.items) {
        writeLines(`${e.degree} — ${e.school}    ${e.start} – ${e.end}`, 11, true, [20, 20, 20]);
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
      for (const b of d.items.filter(Boolean)) writeLines(`• ${b}`, 10, false, [30, 30, 30], 8);
      break;
    }
  }
}
