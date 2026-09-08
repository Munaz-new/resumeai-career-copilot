export * from "./analysisStore";

import { analyzeResume as legacyAnalyzeResume } from "./analysisStore";
import type { AnalysisResult, DebugInfo } from "./analysisStore";
import { buildScoreBreakdown } from "./scoreBreakdown";

/**
 * Accuracy layer for the existing analyzer.
 *
 * The legacy analyzer is intentionally kept as the source of the broader
 * resume-quality signals. This layer corrects high-impact matching issues:
 * 1. substring matches such as "java" inside "javascript";
 * 2. keyword scores being diluted by generic job-description boilerplate;
 * 3. keyword scores treating every remaining JD word as equally important.
 */

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "you", "your", "our", "will", "have", "that", "this", "from",
  "they", "are", "was", "were", "been", "being", "has", "had", "does", "did", "doing", "would",
  "could", "should", "may", "might", "must", "shall", "can", "need", "dare", "ought", "used",
  "about", "above", "after", "again", "all", "also", "between", "both", "but", "each", "etc",
  "not", "only", "other", "some", "such", "than", "too", "very", "just", "because", "into",
  "through", "during", "before", "while", "then", "more", "most", "what", "which", "who", "whom",
  "how", "when", "where", "why", "able", "looking", "seeking", "candidate", "candidates", "role",
  "roles", "position", "positions", "job", "jobs", "opening", "openings", "company", "organization",
  "responsibilities", "responsibility", "requirements", "requirement", "required", "preferred",
  "prefer", "strong", "excellent", "good", "great", "ideal", "working", "work", "works", "worked",
  "experience", "experienced", "years", "year", "including", "includes", "include", "provide", "providing",
  "support", "help", "helps", "ability", "abilities", "knowledge", "skills", "skill", "team", "teams",
  "environment", "environments", "opportunity", "opportunities", "join", "joining", "successful",
  "success", "responsible", "develop", "development", "using", "use", "used", "across", "within",
  "ensure", "ensuring", "maintain", "maintaining", "related", "relevant", "etcetera", "motivated",
  "professional", "familiarity", "understanding", "understand", "follow", "follows", "following",
  "looking", "seeking", "build", "built", "write", "writes", "wrote", "provide", "provides",
  "participate", "contribute", "contributes", "identify", "identified", "implement", "implemented",
  "deliver", "delivered", "create", "created", "create", "make", "made", "ensure", "ensuring",
  "basic", "modern", "effective", "clean", "readable", "reusable", "maintainable", "reliable",
  "scalable", "user", "users", "teamwork", "communication",
]);

const ALIASES: Record<string, string> = {
  "js": "javascript", "es6": "javascript", "ecmascript": "javascript", "ts": "typescript",
  "python3": "python", "python 3": "python", "c sharp": "c#", "csharp": "c#", "cpp": "c++",
  "cplusplus": "c++", "golang": "go", "react.js": "react", "reactjs": "react", "node": "node.js",
  "nodejs": "node.js", "node js": "node.js", "next": "next.js", "nextjs": "next.js", "next js": "next.js",
  "vue.js": "vue", "vuejs": "vue", "angular.js": "angular", "angularjs": "angular",
  "express.js": "express", "expressjs": "express", "springboot": "spring boot", "dotnet": ".net",
  "dot net": ".net", "amazon web services": "aws", "amazon aws": "aws", "google cloud": "gcp",
  "google cloud platform": "gcp", "microsoft azure": "azure", "k8s": "kubernetes",
  "restful api": "rest api", "restful apis": "rest api", "restful": "rest api", "rest-api": "rest api",
  "postgres": "postgresql", "mongo": "mongodb", "elastic search": "elasticsearch", "dynamo db": "dynamodb",
  "dynamo": "dynamodb", "ml": "machine learning", "artificial intelligence": "ai", "dl": "deep learning",
  "natural language processing": "nlp", "visual studio code": "vs code", "vscode": "vs code",
  "microsoft word": "ms word", "ms-word": "ms word", "microsoft excel": "excel", "ms excel": "excel",
  "ms-excel": "excel", "microsoft powerpoint": "powerpoint", "ms powerpoint": "powerpoint", "ppt": "powerpoint",
  "google workspace": "google docs", "g suite": "google docs", "team work": "teamwork", "team player": "teamwork",
  "communication skills": "communication", "problem-solving": "problem solving", "analytical skills": "analytical thinking",
  "computer basics": "basic computer", "computer skills": "basic computer", "computer literacy": "basic computer",
  "time-management": "time management", "detail-oriented": "attention to detail", "detail oriented": "attention to detail",
  "self-motivated": "self motivation", "self motivated": "self motivation", "multi-tasking": "multitasking",
  "multi tasking": "multitasking", "customer support": "customer service", "client support": "customer service",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(text: string): string {
  let value = text.toLowerCase().replace(/[\u2010-\u2015]/g, "-");
  for (const [alias, canonical] of Object.entries(ALIASES).sort((a, b) => b[0].length - a[0].length)) {
    const escaped = escapeRegExp(alias);
    value = value.replace(new RegExp(`(?:^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "gi"), (match) => {
      const prefix = match[0] && /[a-z0-9]/i.test(match[0]) ? "" : match[0];
      return `${prefix}${canonical}`;
    });
  }
  return value.replace(/\s+/g, " ").trim();
}

function containsTerm(text: string, term: string): boolean {
  const normalizedTerm = term.toLowerCase().replace(/\s+/g, " ").trim();
  if (!normalizedTerm) return false;
  const pattern = normalizedTerm.split(" ").map(escapeRegExp).join("\\s+");
  return new RegExp(`(?:^|[^a-z0-9])${pattern}(?=$|[^a-z0-9])`, "i").test(text);
}

function wordTokens(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9+#.\s/-]/g, " ").split(/\s+/)
    .map((word) => word.replace(/^[./-]+|[./-]+$/g, ""))
    .filter((word) => word.length >= 4 && !STOP_WORDS.has(word) && !/^\d+$/.test(word));
}

function unique<T>(values: T[]): T[] { return [...new Set(values)]; }

function getSkillCandidates(result: AnalysisResult): string[] {
  return unique([...result.matchedSkills, ...result.missingSkills].map((skill) => skill.toLowerCase().trim()).filter(Boolean));
}

function calculateSkillMatch(result: AnalysisResult, resumeText: string, jdText: string) {
  const resumeNorm = normalizeText(resumeText);
  const jdNorm = normalizeText(jdText);
  const candidates = getSkillCandidates(result);
  const requiredSkills = candidates.filter((skill) => containsTerm(jdNorm, skill));
  const matchedSkills = requiredSkills.filter((skill) => containsTerm(resumeNorm, skill));
  const missingSkills = requiredSkills.filter((skill) => !containsTerm(resumeNorm, skill));
  const skillsMatch = requiredSkills.length > 0 ? Math.round((matchedSkills.length / requiredSkills.length) * 100) : 0;
  return { requiredSkills, matchedSkills, missingSkills, skillsMatch };
}

function keywordWeight(keyword: string, frequency: number, skillSet: Set<string>): number {
  if (skillSet.has(keyword)) return 3;
  if (/[+#.]|\d/.test(keyword)) return 2.5;
  if (frequency >= 3) return 2;
  if (frequency === 2) return 1.5;
  return 1;
}

function calculateKeywordMatch(
  result: AnalysisResult,
  resumeText: string,
  jdText: string,
  exactSkills: { requiredSkills: string[]; matchedSkills: string[] }
): number {
  const resumeNorm = normalizeText(resumeText);
  const jdNorm = normalizeText(jdText);
  const skillSet = new Set(exactSkills.requiredSkills);

  // Score meaningful JD terms rather than every word. Skill terms get the
  // highest weight, while repeated or technical terms receive additional weight.
  const frequencies = new Map<string, number>();
  for (const word of wordTokens(jdNorm)) {
    frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  }

  const lexicalKeywords = [...frequencies.keys()]
    .filter((word) => !skillSet.has(word))
    .filter((word) => !exactSkills.requiredSkills.some((skill) => skill.split(/\s+/).includes(word)))
    .filter((word) => word.length >= 4);

  const skillScore = exactSkills.requiredSkills.reduce((sum, skill) => {
    return sum + (containsTerm(resumeNorm, skill) ? keywordWeight(skill, 1, skillSet) : 0);
  }, 0);
  const totalSkillWeight = exactSkills.requiredSkills.reduce((sum, skill) => sum + keywordWeight(skill, 1, skillSet), 0);

  const lexicalScore = lexicalKeywords.reduce((sum, word) => {
    return sum + (containsTerm(resumeNorm, word) ? keywordWeight(word, frequencies.get(word) ?? 1, skillSet) : 0);
  }, 0);
  const totalLexicalWeight = lexicalKeywords.reduce(
    (sum, word) => sum + keywordWeight(word, frequencies.get(word) ?? 1, skillSet),
    0
  );

  const totalWeight = totalSkillWeight + totalLexicalWeight;
  if (totalWeight === 0) return result.keywordMatch;
  return Math.round(((skillScore + lexicalScore) / totalWeight) * 100);
}

export function analyzeResume(resumeText: string, jobDescription: string, roastMode: boolean): { result: AnalysisResult; debug: DebugInfo } {
  const legacy = legacyAnalyzeResume(resumeText, jobDescription, roastMode);
  const exactSkills = calculateSkillMatch(legacy.result, resumeText, jobDescription);
  const keywordMatch = calculateKeywordMatch(legacy.result, resumeText, jobDescription, exactSkills);
  const correctedResult: AnalysisResult = {
    ...legacy.result,
    keywordMatch,
    skillsMatch: exactSkills.skillsMatch,
    matchedSkills: exactSkills.matchedSkills.map((skill) => skill.charAt(0).toUpperCase() + skill.slice(1)),
    missingSkills: exactSkills.missingSkills.map((skill) => skill.charAt(0).toUpperCase() + skill.slice(1)),
  };
  correctedResult.atsScore = Math.max(0, Math.min(100, Math.round(
    keywordMatch * 0.35 + exactSkills.skillsMatch * 0.20 + (correctedResult.parseability ?? 100) * 0.15 +
    correctedResult.formattingScore * 0.10 + correctedResult.readabilityScore * 0.10 + correctedResult.sectionCompleteness * 0.05 +
    (correctedResult.achievementQuality ?? 0) * 0.05 - (exactSkills.skillsMatch < 40 ? 5 : 0)
  )));
  correctedResult.scoreBreakdown = buildScoreBreakdown(correctedResult);
  correctedResult.jobReadiness = Math.min(100, Math.round(
    correctedResult.atsScore * 0.4 + exactSkills.skillsMatch * 0.3 + correctedResult.sectionCompleteness * 0.15 + correctedResult.readabilityScore * 0.15
  ));
  const debug: DebugInfo = {
    ...legacy.debug,
    matchedKeywordsCount: Math.round((keywordMatch / 100) * Math.max(1, legacy.debug.totalJDKeywords)),
    matchedSkillsCount: exactSkills.matchedSkills.length,
    totalRequiredSkills: exactSkills.requiredSkills.length,
    formulaOutput: correctedResult.atsScore,
  };
  return { result: correctedResult, debug };
}