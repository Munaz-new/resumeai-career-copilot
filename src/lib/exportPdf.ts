import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { AnalysisResult } from "./analysisStore";

export function exportAnalysisReport(
  result: AnalysisResult,
  fileName: string,
  jobTitle: string
) {
  const doc = new jsPDF();
  const now = new Date().toLocaleString();
  const pageW = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("ResumeAI Analysis Report", 14, 22);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${now}`, 14, 30);

  // Resume info
  let y = 45;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Resume Details", 14, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`File: ${fileName || "Pasted Resume"}`, 14, y);
  y += 6;
  doc.text(`Target Role: ${jobTitle || "Not specified"}`, 14, y);
  y += 12;

  // ATS Score
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  const scoreColor = result.atsScore >= 70 ? [34, 197, 94] : result.atsScore >= 50 ? [234, 179, 8] : [239, 68, 68];
  doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
  doc.text(`ATS Score: ${result.atsScore}%`, 14, y);
  y += 10;

  if (typeof result.recruiterScanScore === "number") {
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`Recruiter Score: ${result.recruiterScanScore}%`, 14, y);
    y += 8;
  }

  // Score breakdown table
  doc.setTextColor(30, 41, 59);
  autoTable(doc, {
    startY: y,
    head: [["Metric", "Score"]],
    body: [
      ["Keyword Match", `${result.keywordMatch}%`],
      ["Skills Match", `${result.skillsMatch}%`],
      ["Parseability", `${result.parseability ?? "-"}%`],
      ["Formatting Quality", `${result.formattingScore}%`],
      ["Readability", `${result.readabilityScore}%`],
      ["Section Completeness", `${result.sectionCompleteness}%`],
      ["Achievement Quality", `${result.achievementQuality ?? "-"}%`],
    ],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 4 },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Score Breakdown ("Why this score?")
  if (result.scoreBreakdown && result.scoreBreakdown.length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Why this score?", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const it of result.scoreBreakdown) {
      if (y > 280) { doc.addPage(); y = 20; }
      if (it.positive) doc.setTextColor(34, 197, 94);
      else doc.setTextColor(239, 68, 68);
      const sign = it.delta > 0 ? `+${it.delta}` : it.delta < 0 ? `${it.delta}` : "•";
      doc.text(`${sign}  ${it.label}`, 16, y);
      y += 5;
    }
    doc.setTextColor(30, 41, 59);
    y += 4;
  }

  // Matched Skills
  if (result.matchedSkills.length > 0) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Matched Skills", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const skillsText = result.matchedSkills.join(", ");
    const lines = doc.splitTextToSize(skillsText, pageW - 28);
    doc.text(lines, 14, y);
    y += lines.length * 5 + 6;
  }

  // Missing Skills
  if (result.missingSkills.length > 0) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(239, 68, 68);
    doc.text("Missing Skills", 14, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const missingText = result.missingSkills.join(", ");
    const mLines = doc.splitTextToSize(missingText, pageW - 28);
    doc.text(mLines, 14, y);
    y += mLines.length * 5 + 6;
  }

  // Suggestions
  if (result.suggestions.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Smart Suggestions", 14, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const s of result.suggestions) {
      if (y > 275) { doc.addPage(); y = 20; }
      const sLines = doc.splitTextToSize(`• ${s}`, pageW - 28);
      doc.text(sLines, 14, y);
      y += sLines.length * 5 + 2;
    }
    y += 4;
  }

  // Job Ready Meter
  if (y > 260) { doc.addPage(); y = 20; }
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const readinessScore = result.jobReadiness ?? result.atsScore;
  const readiness = readinessScore >= 80 ? "Industry Ready" : readinessScore >= 60 ? "Job Ready" : readinessScore >= 40 ? "Internship Ready" : "Not Ready";
  doc.text(`Job Readiness: ${readinessScore}% — ${readiness}`, 14, y);
  y += 8;

  // Strengths
  if (result.strengths && result.strengths.length > 0) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(34, 197, 94);
    doc.text("Strengths", 14, y); y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    for (const s of result.strengths) {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(`+ ${s}`, 16, y); y += 5;
    }
    y += 3;
  }

  // Weaknesses
  if (result.weaknesses && result.weaknesses.length > 0) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(234, 179, 8);
    doc.text("Areas to improve", 14, y); y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    for (const w of result.weaknesses) {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(`- ${w}`, 16, y); y += 5;
    }
    y += 3;
  }

  // Employment gaps
  if (result.employmentGaps && result.employmentGaps.length > 0) {
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Employment Gaps Detected", 14, y); y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const g of result.employmentGaps) {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(`• ${g.from} → ${g.to} (~${g.months} months)`, 16, y); y += 5;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("ResumeAI — AI-Powered Resume Analysis", 14, doc.internal.pageSize.getHeight() - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageW - 30, doc.internal.pageSize.getHeight() - 10);
  }

  doc.save(`ResumeAI-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
