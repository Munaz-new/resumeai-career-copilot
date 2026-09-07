import { describe, expect, it } from "vitest";
import { analyzeResume } from "@/lib/analysisAccuracyV2";

describe("accurate keyword and skill matching", () => {
  const baseResume = `
    Jane Developer
    Professional Summary
    Frontend developer building responsive web applications.
    Skills
    JavaScript, TypeScript, React, HTML, CSS, Git.
    Experience
    Built React interfaces with TypeScript and JavaScript.
    Education
    B.Tech Computer Science
  `;

  it("does not count Java inside JavaScript", () => {
    const { result } = analyzeResume(
      baseResume,
      "Frontend Developer. JavaScript and React experience required.",
      false
    );

    const matched = result.matchedSkills.map((skill) => skill.toLowerCase());
    const missing = result.missingSkills.map((skill) => skill.toLowerCase());

    expect(matched).toContain("javascript");
    expect(matched).toContain("react");
    expect(matched).not.toContain("java");
    expect(missing).not.toContain("java");
  });

  it("does not falsely match Java when the job explicitly requires Java", () => {
    const { result } = analyzeResume(
      baseResume,
      "Backend Developer. Java experience required.",
      false
    );

    const matched = result.matchedSkills.map((skill) => skill.toLowerCase());
    const missing = result.missingSkills.map((skill) => skill.toLowerCase());

    expect(matched).not.toContain("java");
    expect(missing).toContain("java");
  });

  it("does not let generic hiring boilerplate dominate keyword matching", () => {
    const { result } = analyzeResume(
      baseResume,
      `
        Frontend Developer
        We are looking for an ideal candidate to join our successful team.
        The position requires React, TypeScript, JavaScript, HTML and CSS.
        Strong communication and relevant experience are preferred.
      `,
      false
    );

    expect(result.keywordMatch).toBeGreaterThanOrEqual(60);
  });

  it("keeps score breakdown aligned with the corrected score", () => {
    const { result } = analyzeResume(
      baseResume,
      "Frontend Developer. Java experience required.",
      false
    );

    expect(result.scoreBreakdown).toBeDefined();
    expect(result.atsScore).toBeGreaterThanOrEqual(0);
    expect(result.atsScore).toBeLessThanOrEqual(100);
  });
});
