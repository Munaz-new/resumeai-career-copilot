import jsPDF from "jspdf";
import type { ResumeDraft, ResumeSection, SectionData } from "./resumeDraft";

const GRAY: [number, number, number] = [185, 185, 185];
const GOLD: [number, number, number] = [201, 167, 118];
const INK: [number, number, number] = [52, 52, 52];
const MUTED: [number, number, number] = [82, 82, 82];
const WHITE: [number, number, number] = [255, 255, 255];

function wrap(doc: jsPDF, value: string, width: number): string[] {
  return doc.splitTextToSize(value || "", width) as string[];
}

function fitNameSize(doc: jsPDF, name: string, width: number): number {
  let size = 29;
  while (size > 18) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    if (doc.getTextWidth(name) <= width) return size;
    size -= 1;
  }
  return size;
}

function sectionTitle(doc: jsPDF, title: string, x: number, y: number, width: number, color = INK) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...color);
  doc.setCharSpace(0.9);
  doc.text(title.toUpperCase(), x, y);
  doc.setCharSpace(0);
  doc.setDrawColor(156, 156, 156);
  doc.setLineWidth(0.5);
  doc.line(x, y + 4, x + width, y + 4);
  return y + 17;
}

function drawBodyText(doc: jsPDF, text: string, x: number, y: number, width: number, size = 8.4, leading = 1.35, color = MUTED, bold = false) {
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

function drawBullets(doc: jsPDF, bullets: string[], x: number, y: number, width: number, size = 8.2) {
  for (const bullet of bullets.filter(Boolean)) {
    const lines = wrap(doc, `• ${bullet}`, width);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...MUTED);
    for (const line of lines) {
      doc.text(line, x, y);
      y += size * 1.35;
    }
    y += 1.5;
  }
  return y;
}

function renderSidebar(doc: jsPDF, draft: ResumeDraft, x: number, y: number, width: number, bottom: number) {
  const sorted = [...draft.sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const education = sorted.find((s) => s.type === "education");
  const skills = sorted.find((s) => s.type === "skills");
  const extras = sorted.filter((s) => s.type === "achievements" || s.type === "activities");

  const heading = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.8);
    doc.setTextColor(...INK);
    doc.setCharSpace(1.1);
    doc.text(title.toUpperCase(), x, y);
    doc.setCharSpace(0);
    doc.setDrawColor(119, 119, 119);
    doc.setLineWidth(0.45);
    doc.line(x, y + 4, x + width, y + 4);
    y += 17;
  };

  if (education) {
    heading("Education");
    const d = education.data as SectionData["education"];
    for (const item of d.items) {
      y = drawBodyText(doc, item.school, x, y, width, 8.4, 1.35, INK, true);
      y = drawBodyText(doc, item.degree, x, y, width, 8.2, 1.35);
      y = drawBodyText(doc, `${item.start} – ${item.end}`, x, y, width, 8.2, 1.35);
      if (item.details) y = drawBodyText(doc, item.details, x, y, width, 8.0, 1.35);
      y += 8;
    }
  }

  if (skills) {
    heading("Skills");
    const d = skills.data as SectionData["skills"];
    y = drawBullets(doc, d.items, x + 2, y, width - 2, 8.2);
    y += 7;
  }

  for (const section of extras) {
    if (y > bottom - 45) break;
    heading(section.type === "activities" ? "Activities" : "Soft Skills");
    const d = section.data as { items: string[] };
    y = drawBullets(doc, d.items, x + 2, y, width - 2, 8.0);
    y += 7;
  }
}

function renderMain(doc: jsPDF, draft: ResumeDraft, x: number, y: number, width: number, bottom: number) {
  const sorted = [...draft.sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
  const experience = sorted.find((s) => s.type === "experience");
  const mainSections = sorted.filter((s) => !["summary", "education", "skills", "achievements", "activities", "experience"].includes(s.type));

  if (experience) {
    y = sectionTitle(doc, "Work History", x, y, width);
    const d = experience.data as SectionData["experience"];
    for (const item of d.items) {
      y = drawBodyText(doc, item.role, x, y, width, 9.3, 1.3, INK, true);
      y = drawBodyText(doc, item.company, x, y, width, 8.2, 1.3);
      y = drawBodyText(doc, `${item.start} – ${item.end}`, x, y, width, 8.0, 1.3, MUTED);
      y += 3;
      y = drawBullets(doc, item.bullets, x + 4, y, width - 4, 8.1);
      y += 6;
      if (y > bottom - 35) break;
    }
  }

  for (const section of mainSections) {
    if (y > bottom - 45) break;
    const title = section.type === "projects" ? "Projects" : section.type === "certifications" ? "Certifications" : section.type;
    y = sectionTitle(doc, title, x, y, width);

    if (section.type === "projects") {
      const d = section.data as SectionData["projects"];
      for (const item of d.items) {
        y = drawBodyText(doc, item.name, x, y, width, 9.0, 1.3, INK, true);
        if (item.tech) y = drawBodyText(doc, item.tech, x, y, width, 7.7, 1.3, MUTED);
        if (item.link) y = drawBodyText(doc, item.link, x, y, width, 7.4, 1.3, MUTED);
        y = drawBullets(doc, item.bullets, x + 4, y + 1, width - 4, 8.0);
        y += 5;
        if (y > bottom - 35) break;
      }
    } else if (section.type === "certifications") {
      const d = section.data as SectionData["certifications"];
      for (const item of d.items) {
        y = drawBodyText(doc, item.name, x, y, width, 8.5, 1.3, INK, true);
        y = drawBodyText(doc, [item.issuer, item.date].filter(Boolean).join(" • "), x, y, width, 7.8, 1.3);
        y += 4;
      }
    } else {
      const d = section.data as { items?: string[]; text?: string };
      if (d.text) y = drawBodyText(doc, d.text, x, y, width);
      if (d.items) y = drawBullets(doc, d.items, x + 4, y, width - 4);
    }
  }
}

export function exportEditorialCvPdf(draft: ResumeDraft) {
  const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const sidebarW = Math.round(pageW * 0.30);
  const mainW = pageW - sidebarW;
  const headerH = 122;
  const marginX = 34;
  const mainX = sidebarW + 28;
  const mainWidth = mainW - 52;
  const c = draft.contact;

  doc.setFillColor(...WHITE);
  doc.rect(0, 0, pageW, pageH, "F");

  doc.setFillColor(...GRAY);
  doc.rect(0, 0, sidebarW, headerH, "F");
  doc.setFillColor(...WHITE);
  doc.rect(sidebarW, 0, mainW, headerH, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.setCharSpace(1.4);
  doc.text("CONTACT", marginX, 25);
  doc.setCharSpace(0);
  let contactY = 43;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.1);
  for (const line of [c.phone, c.email, c.location, ...c.links.map((l) => `${l.label}: ${l.url}`)].filter(Boolean)) {
    for (const wrapped of wrap(doc, line, sidebarW - marginX * 2)) {
      doc.text(wrapped, marginX, contactY);
      contactY += 11;
    }
  }

  const name = c.name || "Your Name";
  const nameX = sidebarW + 28;
  const nameWidth = mainW - 56;
  const nameSize = fitNameSize(doc, name.toUpperCase(), nameWidth);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(nameSize);
  doc.setTextColor(...INK);
  const nameLines = wrap(doc, name.toUpperCase(), nameWidth);
  let nameY = 58;
  for (const line of nameLines.slice(0, 3)) {
    doc.text(line, nameX, nameY);
    nameY += nameSize * 0.95;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.setCharSpace(1.6);
  doc.text((draft.targetRole || "Professional Title").toUpperCase(), nameX, Math.min(99, nameY + 10));
  doc.setCharSpace(0);

  const summary = [...draft.sections].find((s) => s.enabled && s.type === "summary");
  let summaryH = 0;
  if (summary) {
    const d = summary.data as SectionData["summary"];
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);
    const summaryLines = wrap(doc, d.text || "Add your professional summary...", pageW - 2 * marginX);
    summaryH = Math.max(62, 33 + summaryLines.length * 11);
    doc.setFillColor(...GOLD);
    doc.rect(0, headerH, pageW, summaryH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(68, 55, 42);
    doc.setCharSpace(1.5);
    doc.text("SUMMARY", marginX, headerH + 21);
    doc.setCharSpace(0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.3);
    let sy = headerH + 38;
    for (const line of summaryLines) {
      doc.text(line, marginX, sy);
      sy += 11;
    }
  }

  const contentTop = headerH + summaryH;
  doc.setFillColor(...GRAY);
  doc.rect(0, contentTop, sidebarW, pageH - contentTop, "F");
  doc.setFillColor(...WHITE);
  doc.rect(sidebarW, contentTop, mainW, pageH - contentTop, "F");

  renderSidebar(doc, draft, marginX, contentTop + 27, sidebarW - marginX * 2, pageH - 20);
  renderMain(doc, draft, mainX, contentTop + 27, mainWidth, pageH - 22);

  const fileName = name.trim().replace(/\s+/g, "_");
  doc.save(`Resume-${fileName}.pdf`);
}
