import { describe, expect, it } from "vitest";
import type { AnalysisResult } from "@/lib/analysisStore";
import { buildScoreBreakdown } from "@/lib/scoreBreakdown";

const baseResult: AnalysisResult = {
  atsScore: 64,
  keywordMatch: 38,
  skillsMatch: 47,
  formattingScore: 100,
  readabilityScore: 93,
  sectionCompleteness: 100,
  matchedSkills: [],
  missingSkills: ["Java", "Python"],
  suggestions: [],
  actionableSuggestions: [],
  roastFeedback: [],
  strongBullets: [],
  parseability: 100,
  achievementQuality: 31,
};

describe("ATS score breakdown", () => {
  it("does not apply a second penalty for missing skills", () => {
    const items = buildScoreBreakdown(baseResult);
    const labels = items.map((item) => item.label.toLowerCase());

    expect(labels.some((label) => label.includes("missing") && label.includes("penalty"))).toBe(false);
    expect(items.some((item) => item.delta === -15)).toBe(false);
  });

  it("uses the real skills-under-40 penalty only when applicable", () => {
    const items = buildScoreBreakdown({ ...baseResult, skillsMatch: 39 });
    expect(items).toContainEqual({
      label: "Skills match under 40% penalty",
      delta: -5,
      positive: false,
    });
  });

  it("shows the keyword cap without pretending it is a score penalty", () => {
    const items = buildScoreBreakdown({
      ...baseResult,
      keywordMatch: 25,
      skillsMatch: 100,
      atsScore: 60,
    });

    expect(items).toContainEqual({
      label: "Low keyword match: ATS capped at 60",
      delta: 0,
      positive: false,
    });
  });

  it("preserves decimal weighted contributions so rounding is transparent", () => {
    const items = buildScoreBreakdown(baseResult);
    const keyword = items.find((item) => item.label.startsWith("Keyword match"));
    const skills = items.find((item) => item.label.startsWith("Skills match"));

    expect(keyword?.delta).toBe(13.3);
    expect(skills?.delta).toBe(9.4);
  });
});
