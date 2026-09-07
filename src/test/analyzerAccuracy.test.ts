import { describe, expect, it } from "vitest";
import { analyzeResume } from "@/lib/analysisStore";

describe("analyzer accuracy contracts", () => {
  it("does not treat generic job-description wording as a skill", () => {
    const resume = `
      Alex Morgan
      Professional Summary
      Frontend developer building web applications.
      Skills
      React, TypeScript, JavaScript, HTML, CSS, Git.
      Experience
      Developed responsive interfaces and collaborated with engineering teams.
      Education
      B.Tech Computer Science
    `;
    const jd = `
      Frontend Developer
      We need someone who can work with a team, communicate clearly, and deliver
      high quality results. React and TypeScript experience are required.
    `;

    const { result } = analyzeResume(resume, jd, false);

    expect(result.matchedSkills.map((s) => s.toLowerCase())).toEqual(
      expect.arrayContaining(["react", "typescript"]),
    );
    expect(result.matchedSkills.map((s) => s.toLowerCase())).not.toContain("word");
  });

  it("does not infer Docker from the generic word container", () => {
    const resume = `
      Alex Morgan
      Summary
      Software developer experienced with React and TypeScript.
      Skills
      React, TypeScript, JavaScript, Git.
      Experience
      Built web applications and maintained application containers.
      Education
      B.Tech Computer Science
    `;
    const jd = `
      Software Developer
      Experience with application containers and React is preferred.
    `;

    const { result } = analyzeResume(resume, jd, false);
    const matched = result.matchedSkills.map((s) => s.toLowerCase());

    expect(matched).toContain("react");
    expect(matched).not.toContain("docker");
  });

  it("requires explicit evidence before matching Microsoft Word", () => {
    const resume = `
      Alex Morgan
      Summary
      Software developer.
      Skills
      React, TypeScript, JavaScript, Git.
      Experience
      Developed internal web tools.
      Education
      B.Tech Computer Science
    `;
    const jd = `
      Software Developer
      Microsoft Word and React experience are required.
    `;

    const { result } = analyzeResume(resume, jd, false);
    const missing = result.missingSkills.map((s) => s.toLowerCase());

    expect(missing).toContain("ms word");
    expect(result.matchedSkills.map((s) => s.toLowerCase())).not.toContain("ms word");
  });

  it("preserves legitimate synonym matching", () => {
    const resume = `
      Alex Morgan
      Summary
      Frontend developer.
      Skills
      React.js, JS, TS, K8s.
      Experience
      Built responsive web applications.
      Education
      B.Tech Computer Science
    `;
    const jd = `
      Frontend Developer
      React, JavaScript, TypeScript and Kubernetes experience required.
    `;

    const { result } = analyzeResume(resume, jd, false);
    const matched = result.matchedSkills.map((s) => s.toLowerCase());

    expect(matched).toEqual(
      expect.arrayContaining(["react", "javascript", "typescript", "kubernetes"]),
    );
  });

  it("does not count a common two-letter word as a technical skill", () => {
    const resume = `
      Alex Morgan
      Summary
      Developer with experience building web applications.
      Skills
      React, TypeScript, JavaScript, Git.
      Experience
      Built and tested frontend features.
      Education
      B.Tech Computer Science
    `;
    const jd = `
      Frontend Developer
      We are looking for a developer with strong React experience.
    `;

    const { result } = analyzeResume(resume, jd, false);
    const matched = result.matchedSkills.map((s) => s.toLowerCase());

    expect(matched).not.toContain("r");
  });
});
