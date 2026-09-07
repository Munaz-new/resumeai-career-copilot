import { describe, expect, it } from "vitest";
import { analyzeResume } from "@/lib/analysisStore";

describe("resume analyzer", () => {
  const resume = `
    Jane Developer
    Professional Summary
    Frontend developer with experience building responsive web applications.
    Skills
    React, TypeScript, JavaScript, HTML, CSS, Git, GitHub, communication and teamwork.
    Experience
    Frontend Developer | Acme
    Built React interfaces with TypeScript and improved application usability.
    Education
    B.Tech Computer Science
  `;

  const jobDescription = `
    Frontend Developer
    We are looking for a frontend developer with React, TypeScript, JavaScript,
    HTML, CSS and Git experience. Strong communication and teamwork are required.
    Experience building responsive web applications is preferred.
  `;

  it("returns a bounded ATS score and complete score breakdown", () => {
    const { result } = analyzeResume(resume, jobDescription, false);

    expect(result.atsScore).toBeGreaterThanOrEqual(0);
    expect(result.atsScore).toBeLessThanOrEqual(100);
    expect(result.scoreBreakdown?.length).toBeGreaterThan(0);
  });

  it("matches skills that are present in both resume and job description", () => {
    const { result } = analyzeResume(resume, jobDescription, false);
    const matched = result.matchedSkills.map((skill) => skill.toLowerCase());

    expect(matched).toContain("react");
    expect(matched).toContain("typescript");
    expect(matched).toContain("javascript");
    expect(matched).toContain("git");
  });

  it("reports required skills that are missing from the resume", () => {
    const jdWithMissingSkill = `${jobDescription}\nPython experience is also required.`;
    const { result } = analyzeResume(resume, jdWithMissingSkill, false);
    const missing = result.missingSkills.map((skill) => skill.toLowerCase());

    expect(missing).toContain("python");
  });

  it("detects resume sections instead of treating the resume as unstructured text", () => {
    const { result } = analyzeResume(resume, jobDescription, false);

    expect(result.sectionCompleteness).toBeGreaterThan(0);
    expect(result.sectionCompleteness).toBeLessThanOrEqual(100);
  });

  it("keeps recruiter and job-readiness scores bounded", () => {
    const { result } = analyzeResume(resume, jobDescription, false);

    expect(result.recruiterScanScore).toBeGreaterThanOrEqual(0);
    expect(result.recruiterScanScore).toBeLessThanOrEqual(100);
    expect(result.jobReadiness).toBeGreaterThanOrEqual(0);
    expect(result.jobReadiness).toBeLessThanOrEqual(100);
  });
});
