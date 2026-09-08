import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisResult } from "./analysisStore";

const C = {
  ink: [23, 32, 51] as [number, number, number],
  navy: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  line: [226, 232, 240] as [number, number, number],
  purple: [124, 58, 237] as [number, number, number],
  purpleSoft: [245, 243, 255] as [number, number, number],
  blue: [37, 99, 235] as [number, number, number],
  blueSoft: [239, 246, 255] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  greenSoft: [240, 253, 244] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
  amberSoft: [255, 251, 235] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  redSoft: [254, 242, 242] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreColor(score: number): [number, number, number] {
  if (score >= 80) return C.green;
  if (score >= 60) return C.blue;
  if (score >= 40) return C.amber;
  return C.red;
}

function impactLabel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs work";
  return "Priority";
}

function roundedCard(doc: jsPDF, x: number, y: number, w: number, h: number, fill: [number, number, number], stroke = C.line) {
  doc.setFillColor(...fill);
  doc.setDrawColor(...stroke);
  doc.roundedRect(x, y, w, h, 4, 4, "FD");
}

function progress(doc: jsPDF, x: number, y: number, w: number, value: number, color: [number, number, number]) {
  doc.setFillColor(...C.line);
  doc.roundedRect(x, y, w, 3, 1.5, 1.5, "F");
  doc.setFillColor(...color);
  doc.roundedRect(x, y, Math.max(1.5, (w * clamp(value)) / 100), 3, 1.5, 1.5, "F");
}

function sectionTitle(doc: jsPDF, title: string, x: number, y: number) {
  doc.setTextColor(...C.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title.toUpperCase(), x, y);
  doc.setDrawColor(...C.purple);
  doc.setLineWidth(0.8);
  doc.line(x, y + 3, x + 30, y + 3);
}

function professionalRecommendation(text: string, result?: AnalysisResult) {
  return text
    .replace(/possible keyword stuffing/gi, "review keyword distribution")
    .replace(/keyword stuffing/gi, "keyword distribution")
    .replace(/missing\s+\d+\s+key\s+skills/gi, () => `missing ${result?.missingSkills.length ?? 0} key skills`)
    .replace(/\b\d+\s+relevant skills detected\b/gi, () => `${result?.matchedSkills.length ?? 0} relevant skills detected`);
}

function firstLine(doc: jsPDF, text: string, width: number) {
  return doc.splitTextToSize(text, width)[0] ?? text;
}

export function exportAnalysisReport(result: AnalysisResult, fileName: string, jobTitle: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  const now = new Date().toLocaleString();

  // PAGE 1: compact AI career intelligence dashboard
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, pageW, 9, "F");

  doc.setTextColor(...C.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text("ResumeAI", margin, 24);
  doc.setTextColor(...C.purple);
  doc.setFontSize(8);
  doc.text("AI CAREER INTELLIGENCE  /  ANALYSIS REPORT", margin, 30);

  doc.setTextColor(...C.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Generated ${now}`, pageW - margin, 23, { align: "right" });
  doc.text(fileName || "Pasted Resume", pageW - margin, 29, { align: "right" });

  // Target role strip
  roundedCard(doc, margin, 37, contentW, 17, C.purpleSoft, [221, 214, 254]);
  doc.setTextColor(...C.purple);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.text("TARGET ROLE", margin + 7, 44);
  doc.setTextColor(...C.ink);
  doc.setFontSize(10.5);
  doc.text(jobTitle || "Role not specified", margin + 7, 50);
  doc.setTextColor(...C.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("Match quality  •  ATS compatibility  •  recruiter readiness", pageW - margin - 7, 47, { align: "right" });

  // KPI cards
  const cardY = 59;
  const gap = 4;
  const cardW = (contentW - gap * 3) / 4;
  const metrics = [
    ["ATS SCORE", result.atsScore],
    ["KEYWORD MATCH", result.keywordMatch],
    ["SKILLS MATCH", result.skillsMatch],
    ["FORMATTING", result.formattingScore],
  ] as const;

  metrics.forEach(([label, value], i) => {
    const x = margin + i * (cardW + gap);
    const fill = i === 0 ? C.navy : C.white;
    roundedCard(doc, x, cardY, cardW, 31, fill, i === 0 ? C.navy : C.line);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...(i === 0 ? [203, 213, 225] : C.muted));
    doc.text(label, x + 7, cardY + 9);
    doc.setFontSize(21);
    doc.setTextColor(...(i === 0 ? C.white : scoreColor(value)));
    doc.text(String(value), x + 7, cardY + 23);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...(i === 0 ? [203, 213, 225] : C.muted));
    doc.text("/ 100", x + 29, cardY + 22.5);
  });

  sectionTitle(doc, "ATS performance", margin, 99);
  doc.setTextColor(...C.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("Scoring signals behind the overall ATS assessment", margin + 39, 99);

  const breakdown = result.scoreBreakdown ?? [];
  const fallback = [
    ["Keyword match", result.keywordMatch],
    ["Skills match", result.skillsMatch],
    ["Parseability", result.parseability ?? 0],
    ["Formatting", result.formattingScore],
    ["Readability", result.readabilityScore],
    ["Section completeness", result.sectionCompleteness],
    ["Achievement quality", result.achievementQuality ?? 0],
  ] as const;
  const rows = breakdown.length
    ? breakdown.slice(0, 7).map((item) => {
        const label = item.label;
        const score = /keyword/i.test(label) ? result.keywordMatch
          : /skill/i.test(label) ? result.skillsMatch
          : /format/i.test(label) ? result.formattingScore
          : /read/i.test(label) ? result.readabilityScore
          : /section/i.test(label) ? result.sectionCompleteness
          : /parse/i.test(label) ? (result.parseability ?? 0)
          : /achievement/i.test(label) ? (result.achievementQuality ?? 0) : 0;
        return [label, clamp(score)] as [string, number];
      })
    : fallback.map(([label, score]) => [label, clamp(score)] as [string, number]);

  let y = 107;
  rows.forEach(([label, score]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.ink);
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.muted);
    doc.text(`${score}%`, pageW - margin, y, { align: "right" });
    progress(doc, margin + 45, y - 2.5, contentW - 75, score, scoreColor(score));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...scoreColor(score));
    doc.text(impactLabel(score).toUpperCase(), pageW - margin - 1, y + 4.5, { align: "right" });
    y += 7;
  });

  // Priority cards
  sectionTitle(doc, "Top priorities", margin, 164);
  const priorityItems = (result.weaknesses?.length ? result.weaknesses : result.suggestions ?? [])
    .slice(0, 3).map((item) => professionalRecommendation(item, result));
  const priorities = priorityItems.length ? priorityItems : [
    "Improve measurable achievements with specific outcomes.",
    "Strengthen alignment with the target role's required skills.",
    "Review keyword distribution for the target job description.",
  ];
  const pY = 171;
  priorities.forEach((item, i) => {
    const x = margin + i * (contentW / 3);
    const w = contentW / 3 - 3;
    roundedCard(doc, x, pY, w, 25, C.white, C.line);
    doc.setFillColor(...C.purpleSoft);
    doc.circle(x + 10, pY + 9, 5, "F");
    doc.setTextColor(...C.purple);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(String(i + 1).padStart(2, "0"), x + 10, pY + 11, { align: "center" });
    doc.setTextColor(...C.ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(doc.splitTextToSize(item, w - 28).slice(0, 3), x + 20, pY + 7);
  });

  // Skill intelligence
  sectionTitle(doc, "Skill intelligence", margin, 207);
  const skillGap = 6;
  const skillW = (contentW - skillGap) / 2;
  const skillY = 214;
  roundedCard(doc, margin, skillY, skillW, 38, C.greenSoft, [187, 247, 208]);
  roundedCard(doc, margin + skillW + skillGap, skillY, skillW, 38, C.redSoft, [254, 202, 202]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.green);
  doc.text(`MATCHED SKILLS  (${result.matchedSkills.length})`, margin + 7, skillY + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.ink);
  doc.text(doc.splitTextToSize(result.matchedSkills.join("  •  ") || "None detected", skillW - 14).slice(0, 3), margin + 7, skillY + 17);

  const missingX = margin + skillW + skillGap;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.red);
  doc.text(`MISSING SKILLS  (${result.missingSkills.length})`, missingX + 7, skillY + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...C.ink);
  doc.text(doc.splitTextToSize(result.missingSkills.join("  •  ") || "None detected", skillW - 14).slice(0, 3), missingX + 7, skillY + 17);

  // PAGE 2
  doc.addPage();
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, pageW, 9, "F");

  doc.setTextColor(...C.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("Action Plan", margin, 24);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.muted);
  doc.text("Turn the analysis into focused, measurable resume improvements.", margin, 30);

  const readinessScore = clamp(result.jobReadiness ?? result.atsScore);
  const readiness = readinessScore >= 80 ? "Industry Ready" : readinessScore >= 60 ? "Job Ready" : readinessScore >= 40 ? "Internship Ready" : "Not Ready";
  const readinessColor = scoreColor(readinessScore);

  roundedCard(doc, margin, 39, contentW, 42, C.purpleSoft, [221, 214, 254]);
  doc.setTextColor(...C.purple);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("JOB READINESS", margin + 8, 48);
  doc.setTextColor(...C.ink);
  doc.setFontSize(28);
  doc.text(String(readinessScore), margin + 8, 68);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...C.muted);
  doc.text("/ 100", margin + 31, 67.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...readinessColor);
  doc.text(readiness, margin + 8, 76);

  const barX = margin + 78;
  const barW = contentW - 92;
  progress(doc, barX, 58, barW, readinessScore, readinessColor);
  const markerX = barX + barW * readinessScore / 100;
  doc.setDrawColor(...C.ink);
  doc.setLineWidth(0.6);
  doc.line(markerX, 54.5, markerX, 64);
  doc.setTextColor(...C.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.text("0", barX, 69);
  doc.text("40", barX + barW * 0.4, 69, { align: "center" });
  doc.text("60", barX + barW * 0.6, 69, { align: "center" });
  doc.text("80", barX + barW * 0.8, 69, { align: "center" });
  doc.text("100", barX + barW, 69, { align: "right" });

  sectionTitle(doc, "Strengths & opportunities", margin, 96);
  const halfGap = 6;
  const halfW = (contentW - halfGap) / 2;
  const boxY = 103;
  const boxH = 50;
  roundedCard(doc, margin, boxY, halfW, boxH, C.greenSoft, [187, 247, 208]);
  roundedCard(doc, margin + halfW + halfGap, boxY, halfW, boxH, C.amberSoft, [253, 230, 138]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...C.green);
  doc.text("WHAT'S WORKING", margin + 7, boxY + 9);
  doc.setTextColor(...C.ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.2);
  (result.strengths?.slice(0, 5) ?? []).forEach((item, i) => {
    doc.text(`• ${firstLine(doc, professionalRecommendation(item, result), halfW - 17)}`, margin + 7, boxY + 18 + i * 6.5);
  });

  const oppX = margin + halfW + halfGap;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.amber);
  doc.text("FOCUS NEXT", oppX + 7, boxY + 9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.ink);
  (result.weaknesses?.slice(0, 5) ?? []).forEach((item, i) => {
    doc.text(`• ${firstLine(doc, professionalRecommendation(item, result), halfW - 17)}`, oppX + 7, boxY + 18 + i * 6.5);
  });

  sectionTitle(doc, "Smart suggestions", margin, 163);
  const suggestions = result.suggestions?.slice(0, 7).map((item) => professionalRecommendation(item, result)) ?? [];
  autoTable(doc, {
    startY: 170,
    head: [["#", "Recommended action"]],
    body: suggestions.length ? suggestions.map((s, i) => [String(i + 1).padStart(2, "0"), s]) : [["01", "Review missing skills and strengthen measurable achievements."]],
    theme: "plain",
    margin: { left: margin, right: margin },
    styles: { fontSize: 8, cellPadding: 4, textColor: C.ink, lineColor: C.line },
    headStyles: { fillColor: C.navy, textColor: C.white, fontStyle: "bold" },
    columnStyles: { 0: { cellWidth: 14, fontStyle: "bold", textColor: C.purple, halign: "center" }, 1: { cellWidth: contentW - 14 } },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  let finalY = ((doc as any).lastAutoTable?.finalY ?? 222) + 9;
  if (finalY > 258) { doc.addPage(); finalY = 24; }
  sectionTitle(doc, "Final score snapshot", margin, finalY);
  finalY += 7;
  autoTable(doc, {
    startY: finalY,
    head: [["ATS", "Keywords", "Skills", "Formatting", "Readability", "Sections"]],
    body: [[`${result.atsScore}%`, `${result.keywordMatch}%`, `${result.skillsMatch}%`, `${result.formattingScore}%`, `${result.readabilityScore}%`, `${result.sectionCompleteness}%`]],
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: { fontSize: 8.5, halign: "center", cellPadding: 4.5 },
    headStyles: { fillColor: C.purple, textColor: C.white, fontStyle: "bold" },
    bodyStyles: { textColor: C.ink, fontStyle: "bold" },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 13, pageW - margin, pageH - 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...C.muted);
    doc.text("ResumeAI  |  AI Career Intelligence", margin, pageH - 7);
    doc.text(`${i} / ${pageCount}`, pageW - margin, pageH - 7, { align: "right" });
  }

  doc.save(`ResumeAI-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
