// Pure helpers that turn raw analysis signals into contextual,
// recruiter-aware guidance. No AI calls, no side effects.

import type { AnalysisResult, ActionableSuggestion } from "@/lib/analysisStore";

export interface PriorityMissingSkill {
  skill: string;
  frequency: number;
  impact: number; // estimated ATS points if added
  priority: "high" | "nice";
}

/**
 * Group missing skills by JD frequency. High = appears 3+ times OR
 * in the top 30% of the JD; Nice = everything else.
 */
export function computeMissingSkillPriority(
  missingSkills: string[],
  jobDescription: string | undefined,
): PriorityMissingSkill[] {
  const jd = (jobDescription || "").toLowerCase();
  const cutoff = Math.max(80, Math.floor(jd.length * 0.3));
  const topSlice = jd.slice(0, cutoff);

  const result: PriorityMissingSkill[] = missingSkills.map((skill) => {
    const lower = skill.toLowerCase();
    const escaped = lower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    const frequency = jd ? (jd.match(re) || []).length : 0;
    const inTopSection = jd && topSlice.includes(lower);
    const high = frequency >= 3 || inTopSection;
    const impact = Math.min(6, Math.max(2, frequency * 2 || 2));
    return {
      skill,
      frequency,
      impact,
      priority: high ? "high" : "nice",
    };
  });

  // Sort high-priority first, then by frequency desc
  return result.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority === "high" ? -1 : 1;
    return b.frequency - a.frequency;
  });
}

export interface QuickWin {
  title: string;
  impact: number;
  why: string;
}

/** Tiny, dopamine-friendly improvements derived from analysis. */
export function computeQuickWins(result: AnalysisResult): {
  wins: QuickWin[];
  projectedScore: number;
  estMinutes: string;
} {
  const wins: QuickWin[] = [];
  const prioritized = computeMissingSkillPriority(
    result.missingSkills,
    result.jobDescription,
  ).filter((p) => p.priority === "high").slice(0, 3);

  for (const p of prioritized) {
    wins.push({
      title: `Add ${p.skill}`,
      impact: p.impact,
      why: p.frequency > 0
        ? `Mentioned ${p.frequency}× in the job description.`
        : `High-signal keyword for this role.`,
    });
  }

  const text = result.resumeText || "";
  if ((result.quantifiedRatio ?? 1) < 0.4) {
    wins.push({
      title: "Add measurable achievements",
      impact: 3,
      why: "Quantified bullets (%, $, counts) prove impact and lift recruiter trust.",
    });
  }
  if (text && !/github\.com|linkedin\.com/i.test(text)) {
    wins.push({
      title: "Add GitHub or LinkedIn URL",
      impact: 2,
      why: "Recruiters expect a clickable portfolio or profile link.",
    });
  }
  const hasSummary = /\b(summary|profile|objective)\b/i.test(text);
  if (text && !hasSummary) {
    wins.push({
      title: "Write a 2-line professional summary",
      impact: 3,
      why: "The summary is the first thing recruiters scan. Empty = skipped.",
    });
  }

  const totalImpact = wins.reduce((a, w) => a + w.impact, 0);
  const projectedScore = Math.min(95, result.atsScore + totalImpact);
  const minutes = wins.length <= 2 ? "5–8 min" : wins.length <= 4 ? "7–10 min" : "10–15 min";

  return { wins, projectedScore, estMinutes: minutes };
}

export interface EnrichedSuggestion {
  title: string;
  problem: string;
  why: string;
  fix: string;
  gain: string;
}

/** Transform a stored ActionableSuggestion into a Problem/Why/Fix/Gain block. */
export function enrichSuggestion(
  s: ActionableSuggestion,
  result: AnalysisResult,
): EnrichedSuggestion {
  const t = s.title;
  let gain = "+2 ATS";

  if (/missing skill/i.test(t)) {
    const skill = t.replace(/^Add Missing Skill:\s*/i, "").trim();
    const prio = computeMissingSkillPriority([skill], result.jobDescription)[0];
    gain = `+${prio?.impact ?? 3} ATS`;
  } else if (/summary/i.test(t)) gain = "+3 ATS · stronger first impression";
  else if (/measurable|achievement/i.test(t)) gain = "+3 ATS · +40% callback rate";
  else if (/action verbs/i.test(t)) gain = "+2 ATS · stronger recruiter signal";
  else if (/projects/i.test(t)) gain = "+3 ATS · proves applied skill";
  else if (/certification/i.test(t)) gain = "+2 ATS · validates expertise";
  else if (/headers|formatting/i.test(t)) gain = "+5 ATS · fixes parsing";
  else if (/bullet/i.test(t)) gain = "+2 ATS · improves scannability";

  return {
    title: s.title,
    problem: s.reason.split(".")[0] + ".",
    why: s.reason,
    fix: s.fix,
    gain,
  };
}
