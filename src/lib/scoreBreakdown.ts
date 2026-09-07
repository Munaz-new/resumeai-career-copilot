import type { AnalysisResult, ScoreBreakdownItem } from "@/lib/analysisStore";

const WEIGHTS = {
  keywordMatch: 0.35,
  skillsMatch: 0.20,
  parseability: 0.15,
  formattingScore: 0.10,
  readabilityScore: 0.10,
  sectionCompleteness: 0.05,
  achievementQuality: 0.05,
} as const;

export function buildScoreBreakdown(result: AnalysisResult): ScoreBreakdownItem[] {
  const keywordMatch = result.keywordMatch;
  const skillsMatch = result.skillsMatch;
  const parseability = result.parseability ?? 100;
  const formattingScore = result.formattingScore;
  const readabilityScore = result.readabilityScore;
  const sectionCompleteness = result.sectionCompleteness;
  const achievementQuality = result.achievementQuality ?? 0;

  const contributions = [
    { label: `Keyword match (${keywordMatch}%)`, value: keywordMatch * WEIGHTS.keywordMatch },
    { label: `Skills match (${skillsMatch}%)`, value: skillsMatch * WEIGHTS.skillsMatch },
    { label: `Parseability (${parseability}%)`, value: parseability * WEIGHTS.parseability },
    { label: `Formatting (${formattingScore}%)`, value: formattingScore * WEIGHTS.formattingScore },
    { label: `Readability (${readabilityScore}%)`, value: readabilityScore * WEIGHTS.readabilityScore },
    { label: `Section completeness (${sectionCompleteness}%)`, value: sectionCompleteness * WEIGHTS.sectionCompleteness },
    { label: `Achievement quality (${achievementQuality}%)`, value: achievementQuality * WEIGHTS.achievementQuality },
  ];

  const rawScore = contributions.reduce((sum, item) => sum + item.value, 0);
  let adjustedScore = rawScore;
  const items: ScoreBreakdownItem[] = contributions
    .filter((item) => item.value > 0)
    .map((item) => ({ label: item.label, delta: Number(item.value.toFixed(2)), positive: true }));

  let capped = false;
  if (keywordMatch < 30 && adjustedScore > 60) {
    adjustedScore = 60;
    capped = true;
    items.push({ label: "Low keyword match: ATS capped at 60", delta: 0, positive: false });
  } else if (keywordMatch < 50 && adjustedScore > 75) {
    adjustedScore = 75;
    capped = true;
    items.push({ label: "Keyword match below 50%: ATS capped at 75", delta: 0, positive: false });
  }

  if (skillsMatch < 40) {
    adjustedScore -= 5;
    items.push({ label: "Skills match under 40% penalty", delta: -5, positive: false });
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(adjustedScore)));
  if (!capped && Math.round(rawScore) !== Math.round(adjustedScore)) {
    items.push({ label: `Score adjusted to ${finalScore}`, delta: 0, positive: false });
  } else if (Math.round(adjustedScore) !== finalScore) {
    items.push({ label: `Score rounded to ${finalScore}`, delta: 0, positive: true });
  }

  return items;
}
