import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisResult } from "./analysisStore";

const COLORS = {
  ink: [23, 32, 51] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  line: [226, 232, 240] as [number, number, number],
  purple: [139, 92, 246] as [number, number, number],
  purpleSoft: [245, 243, 255] as [number, number, number],
  blue: [37, 99, 235] as [number, number, number],
  green: [22, 163, 74] as [number, number, number],
  amber: [217, 119, 6] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreColor(score: number): [number, number, number] {
  if (score >= 80) return COLORS.green;
  if (score >= 60) return COLORS.blue;
  if (score >= 40) return COLORS.amber;
  return COLORS.red;
}

function impactLabel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs work";
  return "Priority";
}

function impactColor(score: number): [number, number, number] {
  if (score >= 80) return COLORS.green;
  if (score >= 60) return COLORS.blue;
  if (score >= 40) return COLORS.amber;
  return COLORS.red;
}

function roundedCard(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: [number, number, number],
  stroke = COLORS.line,
) {
  doc.setFillColor(...fill);
  doc.setDrawColor(...stroke);
  doc.roundedRect(x, y, w, h, 4, 4, "FD");
}

function progress(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  value: number,
  color: [number, number, number],
) {
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(x, y, w, 3, 1.5, 1.5, "F");
  doc.setFillColor(...color);
  doc.roundedRect(x, y, Math.max(2, (w * clamp(value)) / 100), 3, 1.5, 1.5, "F");
}

function sectionTitle(doc: jsPDF, title: string, x: number, y: number) {
  doc.setTextColor(...COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), x, y);
  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(0.8);
  doc.line(x, y + 3, x + 34, y + 3);
}

function safeFirstLine(doc: jsPDF, text: string, width: number) {
  return doc.splitTextToSize(text, width)[0] ?? text;
}

function professionalRecommendation(text: string, result?: AnalysisResult) {
  return text
    .replace(/possible keyword stuffing/gi, "review keyword distribution")
    .replace(/keyword stuffing/gi, "keyword distribution")
    .replace(/missing\s+\d+\s+key\s+skills/gi, () =>
      `missing ${result?.missingSkills.length ?? 0} key skills`,
    )
    .replace(/\b\d+\s+relevant skills detected\b/gi, () =>
      `${result?.matchedSkills.length ?? 0} relevant skills detected`,
    );
}

export function exportAnalysisReport(result: AnalysisResult, fileName: string, jobTitle: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentW = pageW - margin * 2;
  const now = new Date().toLocaleString();

  // PAGE 1: executive report
  doc.setFillColor(...COLORS.ink);
  doc.rect(0, 0, pageW, 10, "F");

  doc.setTextColor(...COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("ResumeAI", margin, 25);
  doc.setTextColor(...COLORS.purple);
  doc.setFontSize(9);
  doc.text("AI CAREER COPILOT  /  ANALYSIS REPORT", margin, 31);

  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Generated ${now}`, pageW - margin, 25, { align: "right" });
  doc.text(fileName || "Pasted Resume", pageW - margin, 30, { align: "right" });

  roundedCard(doc, margin, 38, contentW, 19, COLORS.purpleSoft, [221, 214, 254]);
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("TARGET ROLE", margin + 7, 45);
  doc.setTextColor(...COLORS.ink);
  doc.setFontSize(11);
  doc.text(jobTitle || "Role not specified", margin + 7, 51);
  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(
    "ResumeAI evaluates match quality, ATS compatibility, and recruiter readiness.",
    margin + 80,
    49,
  );

  const cardY = 64;
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
    const fill = i === 0 ? COLORS.ink : COLORS.white;
    roundedCard(doc, x, cardY, cardW, 35, fill, i === 0 ? COLORS.ink : COLORS.line);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...(i === 0 ? [203, 213, 225] : COLORS.muted));
    doc.text(label, x + 7, cardY + 9);
    doc.setFontSize(23);
    doc.setTextColor(...(i === 0 ? COLORS.white : scoreColor(value)));
    doc.text(String(value), x + 7, cardY + 25);
    doc.setFontSize(9);
    doc.setTextColor(...(i === 0 ? [203, 213, 225] : COLORS.muted));
    doc.setFont("helvetica", "normal");
    doc.text("/ 100", x + 31, cardY + 24.5);
  });

  sectionTitle(doc, "Why this score", margin, 111);
  const breakdown = result.scoreBreakdown ?? [];
  let y = 120;
  const breakdownItems = breakdown.length > 0 ? breakdown : [
    { label: "Keyword Match", score: result.keywordMatch, delta: 0, positive: true },
    { label: "Skills Match", score: result.skillsMatch, delta: 0, positive: true },
    { label: "Parseability", score: result.parseability ?? 0, delta: 0, positive: true },
    { label: "Formatting", score: result.formattingScore, delta: 0, positive: true },
    { label: "Readability", score: result.readabilityScore, delta: 0, positive: true },
    { label: "Section Completeness", score: result.sectionCompleteness, delta: 0, positive: true },
    { label: "Achievement Quality", score: result.achievementQuality ?? 0, delta: 0, positive: true },
  ];

  for (const item of breakdownItems.slice(0, 7)) {
    const score = typeof (item as any).score === "number"
      ? clamp((item as any).score)
      : /keyword/i.test(item.label) ? result.keywordMatch
      : /skill/i.test(item.label) ? result.skillsMatch
      : /format/i.test(item.label) ? result.formattingScore
      : /read/i.test(item.label) ? result.readabilityScore
      : /section/i.test(item.label) ? result.sectionCompleteness
      : /parse/i.test(item.label) ? (result.parseability ?? 0)
      : /achievement/i.test(item.label) ? (result.achievementQuality ?? 0)
      : 0;

    doc.setTextColor(...COLORS.ink);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text(item.label, margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text(`${score}%`, margin + contentW, y, { align: "right" });
    progress(doc, margin, y + 3, contentW - 22, score, scoreColor(score));
    doc.setTextColor(...impactColor(score));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.text(impactLabel(score).toUpperCase(), margin + contentW, y + 3, { align: "right" });
    y += 9;
  }

  y += 3;
  sectionTitle(doc, "Top 3 priorities", margin, y);
  y += 7;
  const priorityItems = (result.weaknesses?.length ? result.weaknesses : result.suggestions ?? [])
    .slice(0, 3)
    .map((item) => professionalRecommendation(item, result));
  const priorities = priorityItems.length > 0
    ? priorityItems
    : [
        "Improve measurable achievements with specific outcomes.",
        "Strengthen alignment with the target role's required skills.",
        "Review keyword distribution for the target job description.",
      ];

  priorities.forEach((item, i) => {
    const x = margin + i * (contentW / 3);
    const w = contentW / 3 - 3;
    roundedCard(doc, x, y, w, 25, COLORS.white, COLORS.line);
    doc.setTextColor(...COLORS.purple);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(String(i + 1).padStart(2, "0"), x + 6, y + 9);
    doc.setTextColor(...COLORS.ink);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(doc.splitTextToSize(item, w - 26).slice(0, 3), x + 22, y + 7);
  });

  y += 33;
  sectionTitle(doc, "Skill analysis", margin, y);
  y += 8;
  const colGap = 6;
  const colW = (contentW - colGap) / 2;
  const leftX = margin;
  const rightX = margin + colW + colGap;
  const skillBoxH = 35;

  roundedCard(doc, leftX, y, colW, skillBoxH, [240, 253, 244], [187, 247, 208]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.green);
  doc.text(`MATCHED SKILLS  (${result.matchedSkills.length})`, leftX + 7, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.ink);
  const matched = result.matchedSkills.join(" - ") || "None detected";
  doc.text(doc.splitTextToSize(matched, colW - 14).slice(0, 3), leftX + 7, y + 17);

  roundedCard(doc, rightX, y, colW, skillBoxH, [254, 242, 242], [254, 202, 202]);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.red);
  doc.text(`MISSING SKILLS  (${result.missingSkills.length})`, rightX + 7, y + 9);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.ink);
  const missing = result.missingSkills.join(" - ") || "None detected";
  doc.text(doc.splitTextToSize(missing, colW - 14).slice(0, 3), rightX + 7, y + 17);

  // PAGE 2
  doc.addPage();
  doc.setFillColor(...COLORS.ink);
  doc.rect(0, 0, pageW, 10, "F");

  doc.setTextColor(...COLORS.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("Action Plan", margin, 25);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Turn the analysis into focused resume improvements.", margin, 31);

  const readinessScore = clamp(result.jobReadiness ?? result.atsScore);
  const readiness = readinessScore >= 80
    ? "Industry Ready"
    : readinessScore >= 60
      ? "Job Ready"
      : readinessScore >= 40
        ? "Internship Ready"
        : "Not Ready";
  const readinessColor = scoreColor(readinessScore);

  roundedCard(doc, margin, 40, contentW, 43, COLORS.purpleSoft, [221, 214, 254]);
  doc.setTextColor(...COLORS.purple);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("JOB READINESS", margin + 8, 49);
  doc.setTextColor(...COLORS.ink);
  doc.setFontSize(28);
  doc.text(String(readinessScore), margin + 8, 69);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.setFont("helvetica", "normal");
  doc.text("/ 100", margin + 31, 68.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...readinessColor);
  doc.text(readiness, margin + 8, 77);

  const readinessBarX = margin + 80;
  const readinessBarY = 59;
  const readinessBarW = contentW - 94;
  progress(doc, readinessBarX, readinessBarY, readinessBarW, readinessScore, readinessColor);

  const markerX = readinessBarX + (readinessBarW * readinessScore) / 100;
  doc.setDrawColor(...COLORS.ink);
  doc.setLineWidth(0.7);
  doc.line(markerX, readinessBarY - 2.5, markerX, readinessBarY + 5.5);
  doc.setFillColor(...COLORS.white);
  doc.circle(markerX, readinessBarY + 1.5, 1.6, "F");
  doc.setDrawColor(...readinessColor);
  doc.setLineWidth(0.6);
  doc.circle(markerX, readinessBarY + 1.5, 1.6, "S");

  doc.setTextColor(...COLORS.muted);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("0", readinessBarX, 69);
  doc.text("40", readinessBarX + readinessBarW * 0.4, 69, { align: "center" });
  doc.text("60", readinessBarX + readinessBarW * 0.6, 69, { align: "center" });
  doc.text("80", readinessBarX + readinessBarW * 0.8, 69, { align: "center" });
  doc.text("100", readinessBarX + readinessBarW, 69, { align: "right" });

  sectionTitle(doc, "Strengths & opportunities", margin, 98);
  const halfGap = 6;
  const halfW = (contentW - halfGap) / 2;
  const boxY = 106;
  const boxH = 51;
  roundedCard(doc, margin, boxY, halfW, boxH, [240, 253, 244], [187, 247, 208]);
  roundedCard(doc, margin + halfW + halfGap, boxY, halfW, boxH, [255, 251, 235], [253, 230, 138]);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.green);
  doc.text("WHAT'S WORKING", margin + 7, boxY + 9);
  doc.setTextColor(...COLORS.ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  const strengths = result.strengths?.slice(0, 5) ?? [];
  strengths.forEach((item, i) => {
    doc.text(`- ${safeFirstLine(doc, item, halfW - 16)}`, margin + 7, boxY + 18 + i * 7);
  });
  if (strengths.length === 0) doc.text("No strengths recorded.", margin + 7, boxY + 19);

  const rightBoxX = margin + halfW + halfGap;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.amber);
  doc.text("FOCUS NEXT", rightBoxX + 7, boxY + 9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.ink);
  const weaknesses = result.weaknesses?.slice(0, 5) ?? [];
  weaknesses.forEach((item, i) => {
    doc.text(`- ${safeFirstLine(doc, professionalRecommendation(item, result), halfW - 16)}`, rightBoxX + 7, boxY + 18 + i * 7);
  });
  if (weaknesses.length === 0) doc.text("No major gaps recorded.", rightBoxX + 7, boxY + 19);

  sectionTitle(doc, "Smart suggestions", margin, 171);
  const suggestions = result.suggestions?.slice(0, 7).map((item) => professionalRecommendation(item, result)) ?? [];
  autoTable(doc, {
    startY: 178,
    head: [["#", "Recommended action"]],
    body: suggestions.length > 0
      ? suggestions.map((s, i) => [String(i + 1).padStart(2, "0"), s])
      : [["01", "Review the missing skills and strengthen measurable achievements."]],
    theme: "plain",
    margin: { left: margin, right: margin },
    styles: { fontSize: 8.5, cellPadding: 5, textColor: COLORS.ink, lineColor: COLORS.line },
    headStyles: { fillColor: COLORS.ink, textColor: COLORS.white, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 14, fontStyle: "bold", textColor: COLORS.purple, halign: "center" },
      1: { cellWidth: contentW - 14 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  let finalY = ((doc as any).lastAutoTable?.finalY ?? 230) + 12;
  if (finalY > 250) {
    doc.addPage();
    finalY = 22;
  }

  sectionTitle(doc, "Final score snapshot", margin, finalY);
  finalY += 7;
  autoTable(doc, {
    startY: finalY,
    head: [["ATS", "Keywords", "Skills", "Formatting", "Readability", "Sections"]],
    body: [[
      `${result.atsScore}%`, `${result.keywordMatch}%`, `${result.skillsMatch}%`,
      `${result.formattingScore}%`, `${result.readabilityScore}%`, `${result.sectionCompleteness}%`,
    ]],
    theme: "grid",
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, halign: "center", cellPadding: 5 },
    headStyles: { fillColor: COLORS.purple, textColor: COLORS.white, fontStyle: "bold" },
    bodyStyles: { textColor: COLORS.ink, fontStyle: "bold" },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.line);
    doc.setLineWidth(0.3);
    doc.line(margin, pageH - 13, pageW - margin, pageH - 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text("ResumeAI  |  AI-Powered Resume Analysis", margin, pageH - 7);
    doc.text(`${i} / ${pageCount}`, pageW - margin, pageH - 7, { align: "right" });
  }

  doc.save(`ResumeAI-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
