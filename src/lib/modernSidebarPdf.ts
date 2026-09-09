import jsPDF from "jspdf";
import type { ResumeDraft, ResumeSection, SectionData } from "./resumeDraft";
import { sectionTitle } from "./resumeDraft";

const SIDEBAR: [number, number, number] = [217, 233, 230];
const HEADER: [number, number, number] = [64, 95, 97];
const DARK: [number, number, number] = [64, 80, 82];
const INK: [number, number, number] = [38, 38, 38];
const MUTED: [number, number, number] = [91, 100, 101];
const RULE: [number, number, number] = [154, 169, 168];
const WHITE: [number, number, number] = [255, 255, 255];

function wrap(doc: jsPDF, text: string, width: number): string[] {
  return doc.splitTextToSize(text || "", width) as string[];
}

function fitNameSize(doc: jsPDF, name: string, width: number): number {
  for (let size = 27; size >= 16; size -= 1) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    if (doc.getTextWidth(name) <= width) return size;
  }
  return 16;
}

function drawWrapped(doc: jsPDF, text: string, x: number, y: number, width: number, size: number, color: [number, number, number], bold = false, leading = 1.4) {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...color);
  const lines = wrap(doc, text, width);
  for (const line of lines) {
    doc.text(line, x, y);
    y += size * leading;
  }
  return y;
}

function drawBullets(doc: jsPDF, items: string[], x: number, y: number, width: number, size: number, color: [number, number, number], gap = 1.5) {
  for (const item of items.filter(Boolean)) {
    const lines = wrap(doc, `• ${item}`, width);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    for (const line of lines) {
      doc.text(line, x, y);
      y += size * 1.4;
    }
    y += gap;
  }
  return y;
}

function heading(doc: jsPDF, title: string, x: number, y: number, width: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  doc.setCharSpace(1.35);
  doc.text(title.toUpperCase(), x, y);
  doc.setCharSpace(0);
  doc.setDrawColor(...RULE);
  doc.setLineWidth(0.55);
  doc.line(x, y + 5, x + width, y + 5);
  return y + 22;
}

function drawMainSection(doc: jsPDF, section: ResumeSection, x: number, y: number, width: number, bottom: number) {
  if (y > bottom - 30) return bottom;
  y = heading(doc, sectionTitle(section.type), x, y, width);

  switch (section.type) {
    case "summary": {
      const d = section.data as SectionData["summary"];
      return drawWrapped(doc, d.text || "Your professional summary...", x, y, width, 8.4, MUTED, false, 1.4) + 8;
    }
    case "projects": {
      const d = section.data as SectionData["projects"];
      for (const p of d.items) {
        if (y > bottom - 50) break;
        y = drawWrapped(doc, p.name || "Project", x, y, width, 9.4, INK, true, 1.25);
        if (p.tech) y = drawWrapped(doc, p.tech, x, y, width, 7.6, MUTED, false, 1.3);
        if (p.link) y = drawWrapped(doc, p.link, x, y, width, 7.3, MUTED, false, 1.3);
        y = drawBullets(doc, p.bullets, x + 4, y + 1, width - 4, 8.0, MUTED);
        y += 5;
      }
      return y + 3;
    }
    case "experience": {
      const d = section.data as SectionData["experience"];
      for (const e of d.items) {
        if (y > bottom - 50) break;
        const titleWidth = Math.max(130, width - 82);
        const titleLines = wrap(doc, `${e.role} | ${e.company}`, titleWidth);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.9);
        doc.setTextColor(...MUTED);
        doc.text(`${e.start} – ${e.end}`, x + width, y, { align: "right" });
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.4);
        doc.setTextColor(...INK);
        for (const line of titleLines) {
          doc.text(line, x, y);
          y += 11;
        }
        y = drawBullets(doc, e.bullets, x + 4, y + 1, width - 4, 8.0, MUTED);
        y += 5;
      }
      return y + 3;
    }
    case "education": {
      const d = section.data as SectionData["education"];
      for (const e of d.items) {
        if (y > bottom - 40) break;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.2);
        doc.setTextColor(...INK);
        doc.text(e.degree || "Education", x, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.9);
        doc.setTextColor(...MUTED);
        doc.text(`${e.start} – ${e.end}`, x + width, y, { align: "right" });
        y += 12;
        y = drawWrapped(doc, `${e.school}${e.details ? ` — ${e.details}` : ""}`, x, y, width - 2, 8.0, MUTED, false, 1.35);
        y += 5;
      }
      return y + 2;
    }
    case "certifications": {
      const d = section.data as SectionData["certifications"];
      for (const c of d.items) {
        if (y > bottom - 35) break;
        const value = [c.name, c.issuer, c.date].filter(Boolean).join(" — ");
        y = drawWrapped(doc, value, x, y, width, 8.1, MUTED, false, 1.35) + 3;
      }
      return y + 2;
    }
    case "achievements":
    case "activities": {
      const d = section.data as { items: string[] };
      return drawBullets(doc, d.items, x + 4, y, width - 4, 8.0, MUTED) + 7;
    }
    case "skills":
      return y;
  }
}

function drawSidebarSection(doc: jsPDF, title: string, items: string[], x: number, y: number, width: number, bottom: number) {
  if (y > bottom - 40) return y;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.8);
  doc.setTextColor(...DARK);
  doc.setCharSpace(1.1);
  doc.text(title.toUpperCase(), x, y);
  doc.setCharSpace(0);
  doc.setDrawColor(145, 170, 167);
  doc.setLineWidth(0.45);
  doc.line(x, y + 4, x + width, y + 4);
  y += 18;
  return drawBullets(doc, items, x + 1, y, width - 1, 7.8, DARK, 1) + 7;
}

export function exportModernSidebarPdf(draft: ResumeDraft) {
  const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const sidebarW = 180;
  const headerH = 132;
  const sideX = 18;
  const sideWidth = sidebarW - 36;
  const mainX = sidebarW + 27;
  const mainWidth = pageW - mainX - 28;
  const contentBottom = pageH - 24;
  const c = draft.contact;

  doc.setFillColor(...WHITE);
  doc.rect(0, 0, pageW, pageH, "F");

  doc.setFillColor(...SIDEBAR);
  doc.rect(0, 0, sidebarW, pageH, "F");
  doc.setFillColor(...HEADER);
  doc.rect(sidebarW, 0, pageW - sidebarW, headerH, "F");

  const initials = (c.name || "Your Name").split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "CV";
  doc.setFillColor(63, 79, 80);
  doc.circle(sidebarW / 2, 65, 34, "F");
  doc.setDrawColor(190, 209, 206);
  doc.setLineWidth(5);
  doc.circle(sidebarW / 2, 65, 34, "S");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text(initials, sidebarW / 2, 72, { align: "center" });

  const name = c.name || "Name Surname";
  const nameSize = fitNameSize(doc, name, pageW - sidebarW - 56);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(235, 245, 243);
  doc.setCharSpace(1.7);
  doc.text((draft.targetRole || "Professional Profile").toUpperCase(), mainX, 45);
  doc.setCharSpace(0);
  doc.setFontSize(nameSize);
  doc.setTextColor(...WHITE);
  const nameLines = wrap(doc, name, pageW - sidebarW - 56);
  let nameY = 75;
  for (const line of nameLines.slice(0, 2)) {
    doc.text(line, mainX, nameY);
    nameY += nameSize * 0.98;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(222, 238, 235);
  doc.setCharSpace(1.5);
  doc.text((draft.targetRole || "Professional Title").toUpperCase(), mainX, Math.min(112, nameY + 4));
  doc.setCharSpace(0);

  let sy = headerH + 27;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.8);
  doc.setTextColor(...DARK);
  doc.setCharSpace(1.1);
  doc.text("CONTACT", sideX, sy);
  doc.setCharSpace(0);
  doc.setDrawColor(145, 170, 167);
  doc.setLineWidth(0.45);
  doc.line(sideX, sy + 4, sideX + sideWidth, sy + 4);
  sy += 19;
  for (const line of [c.phone, c.email, c.location, ...c.links.map((l) => `${l.label}: ${l.url}`)].filter(Boolean)) {
    sy = drawWrapped(doc, line, sideX, sy, sideWidth, 7.6, DARK, false, 1.45) + 2;
  }
  sy += 8;

  const sorted = [...draft.sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const skills = sorted.find((s) => s.type === "skills");
  if (skills) {
    const d = skills.data as SectionData["skills"];
    sy = drawSidebarSection(doc, "Skills", d.items, sideX, sy, sideWidth, contentBottom);
  }
  sy = drawSidebarSection(doc, "Languages", ["Add languages in Activities or your resume content."], sideX, sy, sideWidth, contentBottom);
  for (const s of sorted.filter((section) => section.type === "achievements")) {
    const d = s.data as { items: string[] };
    sy = drawSidebarSection(doc, "Achievements", d.items, sideX, sy, sideWidth, contentBottom);
  }
  for (const s of sorted.filter((section) => section.type === "activities")) {
    const d = s.data as { items: string[] };
    sy = drawSidebarSection(doc, "Interests", d.items, sideX, sy, sideWidth, contentBottom);
  }

  const mainSections = sorted.filter((s) => !["skills", "achievements", "activities"].includes(s.type));
  let y = headerH + 27;
  for (const section of mainSections) {
    y = drawMainSection(doc, section, mainX, y, mainWidth, contentBottom);
    if (y >= contentBottom) break;
  }

  const fileName = name.trim().replace(/\s+/g, "_");
  doc.save(`Resume-${fileName}.pdf`);
}
