import { analyzeResume, type AnalysisResult, type DebugInfo } from "@/lib/analysisStore";

// High-signal skill vocabulary used for job/resume matching. Multi-word skills are
// matched as phrases; short skills require strict token boundaries.
const SKILL_GROUPS = {
  technical: [
    "react", "angular", "vue", "svelte", "next.js", "nuxt", "gatsby",
    "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin", "scala", "perl", "r",
    "node.js", "express", "django", "flask", "spring", "spring boot", "rails", "laravel", "fastapi", ".net", "asp.net",
    "html", "css", "sass", "less", "tailwind", "bootstrap", "material ui", "chakra ui",
    "sql", "postgresql", "mysql", "mongodb", "redis", "firebase", "supabase", "dynamodb", "cassandra", "elasticsearch", "sqlite",
    "docker", "kubernetes", "aws", "azure", "gcp", "ci/cd", "jenkins", "github actions", "gitlab ci", "circleci", "terraform", "ansible",
    "git", "rest api", "graphql", "websocket", "grpc", "microservices", "serverless",
    "machine learning", "deep learning", "tensorflow", "pytorch", "nlp", "ai", "data structures", "computer vision", "neural networks",
    "linux", "bash", "shell scripting", "agile", "scrum", "kanban", "devops", "sre",
    "react native", "flutter", "ionic", "electron", "pandas", "numpy", "scipy", "matplotlib", "scikit-learn", "jupyter",
    "hadoop", "spark", "kafka", "rabbitmq", "oauth", "jwt", "api gateway", "load balancing",
    "unit testing", "integration testing", "test driven development", "jest", "mocha", "cypress", "selenium",
    "data analysis", "data visualization", "data engineering", "etl", "data warehouse", "blockchain", "web3", "smart contracts", "solidity",
  ],
  tools: [
    "figma", "photoshop", "illustrator", "canva", "adobe xd", "sketch", "invision", "ms word", "excel", "powerpoint",
    "google docs", "google sheets", "google slides", "jira", "confluence", "notion", "trello", "slack", "asana", "monday.com",
    "postman", "swagger", "insomnia", "vs code", "intellij", "eclipse", "xcode", "android studio", "tableau", "power bi",
    "looker", "google analytics", "mixpanel", "amplitude", "salesforce", "hubspot", "zendesk", "intercom", "github", "gitlab", "bitbucket",
    "npm", "yarn", "webpack", "vite", "babel", "wordpress", "shopify", "wix", "squarespace", "mailchimp", "sendgrid",
    "after effects", "premiere pro", "final cut pro", "davinci resolve", "blender", "unity", "unreal engine", "sap", "oracle", "erp",
  ],
  soft: [
    "communication", "teamwork", "problem solving", "leadership", "time management", "collaboration", "presentation skills",
    "critical thinking", "adaptability", "creativity", "event coordination", "data entry", "documentation", "internet research", "basic computer",
    "negotiation", "conflict resolution", "mentoring", "coaching", "decision making", "strategic thinking", "analytical thinking",
    "attention to detail", "organizational skills", "multitasking", "customer service", "client relations", "stakeholder management",
    "public speaking", "interpersonal skills", "emotional intelligence", "self motivation", "initiative", "work ethic", "flexibility",
    "cross functional", "cross-functional collaboration", "project management", "change management", "risk management", "innovation",
    "continuous improvement", "process improvement",
  ],
} as const;

const ALIASES: Record<string, string> = {
  "react.js": "react", reactjs: "react", "react js": "react",
  js: "javascript", es6: "javascript", ecmascript: "javascript",
  ts: "typescript", py: "python", python3: "python", "python 3": "python",
  csharp: "c#", "c sharp": "c#", cpp: "c++", cplusplus: "c++", golang: "go",
  node: "node.js", nodejs: "node.js", "node js": "node.js",
  next: "next.js", nextjs: "next.js", "next js": "next.js",
  "vue.js": "vue", vuejs: "vue", "angular.js": "angular", angularjs: "angular",
  "express.js": "express", expressjs: "express", springboot: "spring boot",
  dotnet: ".net", "dot net": ".net", "amazon web services": "aws", "google cloud": "gcp",
  "google cloud platform": "gcp", "microsoft azure": "azure", "ci cd": "ci/cd",
  "continuous integration": "ci/cd", "continuous deployment": "ci/cd", k8s: "kubernetes",
  "restful api": "rest api", "rest apis": "rest api", restful: "rest api", "restful apis": "rest api", "rest-api": "rest api",
  postgres: "postgresql", mongo: "mongodb", "elastic search": "elasticsearch", "dynamo db": "dynamodb",
  ml: "machine learning", "artificial intelligence": "ai", dl: "deep learning", "natural language processing": "nlp",
  vscode: "vs code", "visual studio code": "vs code", tdd: "test driven development",
  "microsoft word": "ms word", "ms-word": "ms word", "microsoft excel": "excel", "ms excel": "excel", "ms-excel": "excel",
  "microsoft powerpoint": "powerpoint", "ms powerpoint": "powerpoint", ppt: "powerpoint",
  "google workspace": "google docs", "g suite": "google docs",
  "communication skills": "communication", "team work": "teamwork", "team player": "teamwork",
  "problem-solving": "problem solving", "analytical skills": "analytical thinking", "time-management": "time management",
  "detail-oriented": "attention to detail", "detail oriented": "attention to detail", "self-motivated": "self motivation",
  "multi-tasking": "multitasking", "multi tasking": "multitasking", interpersonal: "interpersonal skills",
  organizational: "organizational skills", "customer support": "customer service", "client support": "customer service",
  "version control": "git", "source control": "git", "business intelligence": "power bi", "data analytics": "data analysis", "data viz": "data visualization",
  containerization: "docker",
};

const ALL_SKILLS = Array.from(new Set(Object.values(SKILL_GROUPS).flat()));

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(text: string): string {
  let value = text.toLowerCase();
  const aliases = Object.entries(ALIASES).sort((a, b) => b[0].length - a[0].length);
  for (const [alias, canonical] of aliases) {
    value = value.replace(new RegExp(`\\b${escapeRegExp(alias)}\\b`, "gi"), canonical);
  }
  return value;
}

function hasSkill(skill: string, text: string): boolean {
  const escaped = escapeRegExp(skill);
  // Never allow a substring match for short skills such as "r" or "go".
  return skill.length <= 2
    ? new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(text)
    : new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(text);
}

function getSkills(text: string) {
  const normalized = normalizeText(text);
  return ALL_SKILLS.filter((skill) => hasSkill(skill, normalized));
}

function weightedSkillMatch(resumeText: string, jdText: string) {
  const resumeSkills = getSkills(resumeText);
  const jdSkills = getSkills(jdText);
  const matched = jdSkills.filter((skill) => resumeSkills.includes(skill));
  const missing = jdSkills.filter((skill) => !resumeSkills.includes(skill));

  const byCategory = Object.entries(SKILL_GROUPS).map(([name, skills]) => {
    const required = skills.filter((skill) => jdSkills.includes(skill));
    const found = required.filter((skill) => resumeSkills.includes(skill));
    return { name, weight: name === "technical" ? 0.5 : name === "tools" ? 0.3 : 0.2, required, found };
  }).filter((category) => category.required.length > 0);

  const totalWeight = byCategory.reduce((sum, category) => sum + category.weight, 0);
  const score = totalWeight > 0
    ? Math.round(byCategory.reduce((sum, category) => sum + (category.found.length / category.required.length) * 100 * category.weight, 0) / totalWeight)
    : 0;

  return { score, matched, missing, jdSkills };
}

function meaningfulKeywords(jdText: string): string[] {
  const normalized = normalizeText(jdText);
  const foundSkills = getSkills(normalized);
  const generic = new Set([
    "about", "after", "again", "against", "also", "any", "are", "been", "being", "both", "build", "building",
    "candidate", "company", "develop", "developer", "development", "experience", "experienced", "good", "great", "have",
    "help", "high", "including", "looking", "must", "need", "needs", "preferred", "provide", "required", "requirements",
    "responsibilities", "role", "skills", "strong", "team", "teams", "work", "working", "years", "year", "you", "your",
  ]);
  const words = normalized.match(/[a-z][a-z0-9+#./-]{2,}/g) ?? [];
  const candidates = words
    .map((word) => word.replace(/^[./-]+|[./-]+$/g, ""))
    .filter((word) => word.length >= 3 && !generic.has(word));
  return Array.from(new Set([...foundSkills, ...candidates]));
}

function keywordMatch(resumeText: string, jdText: string) {
  const resume = normalizeText(resumeText);
  const keywords = meaningfulKeywords(jdText);
  const matched = keywords.filter((keyword) => hasSkill(keyword, resume));
  return keywords.length > 0 ? Math.round((matched.length / keywords.length) * 100) : 0;
}

export function analyzeResumeAccurate(
  resumeText: string,
  jobDescription: string,
  roastMode: boolean,
): { result: AnalysisResult; debug: DebugInfo } {
  const base = analyzeResume(resumeText, jobDescription, roastMode);
  const skills = weightedSkillMatch(resumeText, jobDescription);
  const correctedKeywordMatch = keywordMatch(resumeText, jobDescription);

  let atsScore =
    correctedKeywordMatch * 0.35 +
    skills.score * 0.20 +
    (base.result.parseability ?? 100) * 0.15 +
    base.result.formattingScore * 0.10 +
    base.result.readabilityScore * 0.10 +
    base.result.sectionCompleteness * 0.05 +
    (base.result.achievementQuality ?? 0) * 0.05;

  if (correctedKeywordMatch < 30) atsScore = Math.min(atsScore, 60);
  else if (correctedKeywordMatch < 50) atsScore = Math.min(atsScore, 75);
  if (skills.score < 40) atsScore -= 5;

  const result: AnalysisResult = {
    ...base.result,
    atsScore: Math.max(0, Math.min(100, Math.round(atsScore))),
    keywordMatch: correctedKeywordMatch,
    skillsMatch: skills.score,
    matchedSkills: skills.matched.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    missingSkills: skills.missing.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
  };

  const debug: DebugInfo = {
    ...base.debug,
    matchedKeywordsCount: Math.round((correctedKeywordMatch / 100) * meaningfulKeywords(jobDescription).length),
    totalJDKeywords: meaningfulKeywords(jobDescription).length,
    matchedSkillsCount: skills.matched.length,
    totalRequiredSkills: skills.jdSkills.length,
    matchedTechnical: skills.matched.filter((s) => SKILL_GROUPS.technical.includes(s as never)),
    matchedTools: skills.matched.filter((s) => SKILL_GROUPS.tools.includes(s as never)),
    matchedSoft: skills.matched.filter((s) => SKILL_GROUPS.soft.includes(s as never)),
    missingTechnical: skills.missing.filter((s) => SKILL_GROUPS.technical.includes(s as never)),
    missingTools: skills.missing.filter((s) => SKILL_GROUPS.tools.includes(s as never)),
    missingSoft: skills.missing.filter((s) => SKILL_GROUPS.soft.includes(s as never)),
    formulaOutput: Math.max(0, Math.min(100, Math.round(atsScore))),
  };

  return { result, debug };
}
