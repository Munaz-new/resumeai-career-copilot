import { describe, expect, it } from "vitest";
import { analyzeResume } from "@/lib/analysisStore";

describe("accurate analyzer matching", () => {
  it("does not infer Docker from container or Word from ordinary prose", () => {
    const resume = `Alex Morgan\nSummary\nFrontend developer building web applications.\nSkills\nReact, TypeScript, JavaScript, Git.\nExperience\nMaintained application containers and collaborated with engineering teams.`;
    const jd = `Frontend Developer\nWe need someone who can work with a team and deliver high quality results. React and TypeScript are required. Experience with application containers is preferred. Microsoft Word is also mentioned.`;
    const { result } = analyzeResume(resume, jd, false);
    const matched = result.matchedSkills.map(s => s.toLowerCase());
    const missing = result.missingSkills.map(s => s.toLowerCase());
    expect(matched).toEqual(expect.arrayContaining(["react", "typescript"]));
    expect(matched).not.toContain("docker");
    expect(matched).not.toContain("ms word");
    expect(missing).toContain("docker");
    expect(missing).toContain("ms word");
  });

  it("keeps legitimate JS, TS and K8s aliases", () => {
    const resume = `Alex Morgan\nSkills\nReact.js, JS, TS, K8s.`;
    const jd = `Frontend Developer\nReact, JavaScript, TypeScript and Kubernetes experience required.`;
    const { result } = analyzeResume(resume, jd, false);
    const matched = result.matchedSkills.map(s => s.toLowerCase());
    expect(matched).toEqual(expect.arrayContaining(["react", "javascript", "typescript", "kubernetes"]));
  });

  it("does not count generic JD prose as a hiring keyword match", () => {
    const resume = `Alex Morgan\nFrontend developer.\nSkills\nReact, TypeScript.`;
    const jd = `Frontend Developer\nWe are looking for someone who can work with a team, communicate clearly, and deliver high quality results using React and TypeScript.`;
    const { result } = analyzeResume(resume, jd, false);
    expect(result.keywordMatch).toBeGreaterThanOrEqual(40);
    expect(result.keywordMatch).toBeLessThanOrEqual(100);
  });
});
