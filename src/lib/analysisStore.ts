// Shared analysis store using localStorage

export interface ActionableSuggestion {
  title: string;
  reason: string;
  fix: string;
}

export interface ScoreBreakdownItem {
  label: string;
  delta: number;
  positive: boolean;
}

export interface AnalysisResult {
  atsScore: number;
  keywordMatch: number;
  skillsMatch: number;
  formattingScore: number;
  readabilityScore: number;
  sectionCompleteness: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  actionableSuggestions: ActionableSuggestion[];
  roastFeedback: string[];
  strongBullets: { original: string; improved: string }[];
  // Career Copilot additions
  recruiterScanScore?: number;
  jobReadiness?: number;
  partialSkills?: string[];
  weakBullets?: string[];
  vagueTerms?: string[];
  stuffedKeywords?: { keyword: string; count: number }[];
  quantifiedRatio?: number;
  employmentGaps?: { from: string; to: string; months: number }[];
  strengths?: string[];
  weaknesses?: string[];
  resumeText?: string;
  jobDescription?: string;
  // Trustworthy ATS additions
  parseability?: number;
  achievementQuality?: number;
  scoreBreakdown?: ScoreBreakdownItem[];
}

export interface AnalysisHistoryEntry {
  id: string;
  fileName: string;
  score: number;
  date: string;
  matchedSkills: string[];
  missingSkills: string[];
  jobDescriptionTitle: string;
  summary: string;
  fullResult: AnalysisResult;
}

const GUEST_HISTORY_KEY = "resumeai-guest-history";
const LAST_ANALYSIS_KEY = "resumeai-last-analysis";
const GUEST_MAX_ENTRIES = 3;

// ---- Guest (localStorage) helpers ----

export function saveGuestAnalysis(
  fileName: string,
  jobDescription: string,
  result: AnalysisResult
): AnalysisHistoryEntry {
  const entry = buildEntry(fileName, jobDescription, result);
  const history = getGuestHistory();
  history.unshift(entry);
  if (history.length > GUEST_MAX_ENTRIES) history.length = GUEST_MAX_ENTRIES;
  try { localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(history)); } catch { /* quota */ }
  localStorage.setItem(LAST_ANALYSIS_KEY, JSON.stringify(entry));
  return entry;
}

export function getGuestHistory(): AnalysisHistoryEntry[] {
  try {
    const raw = localStorage.getItem(GUEST_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function getLastAnalysis(): AnalysisHistoryEntry | null {
  try {
    const raw = localStorage.getItem(LAST_ANALYSIS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearGuestHistory(): void {
  localStorage.removeItem(GUEST_HISTORY_KEY);
  localStorage.removeItem(LAST_ANALYSIS_KEY);
}

// ---- Authenticated (Supabase) helpers ----

import { supabase } from "@/integrations/supabase/client";

export async function saveAuthAnalysis(
  userId: string,
  fileName: string,
  jobDescription: string,
  result: AnalysisResult
): Promise<AnalysisHistoryEntry> {
  const entry = buildEntry(fileName, jobDescription, result);
  await supabase.from("analysis_history").insert({
    user_id: userId,
    file_name: entry.fileName,
    ats_score: result.atsScore,
    keyword_match: result.keywordMatch,
    skills_match: result.skillsMatch,
    formatting_score: result.formattingScore,
    readability_score: result.readabilityScore,
    section_completeness: result.sectionCompleteness,
    matched_skills: result.matchedSkills,
    missing_skills: result.missingSkills,
    suggestions: result.suggestions,
    job_description_title: entry.jobDescriptionTitle,
    summary: entry.summary,
  });
  localStorage.setItem(LAST_ANALYSIS_KEY, JSON.stringify(entry));
  return entry;
}

export async function getAuthHistory(userId: string): Promise<AnalysisHistoryEntry[]> {
  const { data } = await supabase
    .from("analysis_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (!data) return [];
  return data.map((row) => ({
    id: row.id,
    fileName: row.file_name,
    score: row.ats_score,
    date: row.created_at,
    matchedSkills: row.matched_skills,
    missingSkills: row.missing_skills,
    jobDescriptionTitle: row.job_description_title,
    summary: row.summary,
    fullResult: {
      atsScore: row.ats_score,
      keywordMatch: row.keyword_match,
      skillsMatch: row.skills_match,
      formattingScore: row.formatting_score,
      readabilityScore: row.readability_score,
      sectionCompleteness: row.section_completeness,
      matchedSkills: row.matched_skills,
      missingSkills: row.missing_skills,
      suggestions: row.suggestions,
      actionableSuggestions: [],
      roastFeedback: [],
      strongBullets: [],
    },
  }));
}

export async function clearAuthHistory(userId: string): Promise<void> {
  await supabase.from("analysis_history").delete().eq("user_id", userId);
  localStorage.removeItem(LAST_ANALYSIS_KEY);
}

// ---- Shared builder ----

function buildEntry(
  fileName: string,
  jobDescription: string,
  result: AnalysisResult
): AnalysisHistoryEntry {
  return {
    id: crypto.randomUUID(),
    fileName: fileName || "Pasted Resume",
    score: result.atsScore,
    date: new Date().toISOString(),
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    jobDescriptionTitle: extractJobTitle(jobDescription),
    summary: generateSummary(result),
    fullResult: result,
  };
}

function extractJobTitle(jd: string): string {
  const lines = jd.trim().split("\n").filter((l) => l.trim());
  if (lines.length === 0) return "Unknown Role";
  const first = lines[0].trim();
  return first.length > 60 ? first.slice(0, 57) + "..." : first;
}

function generateSummary(result: AnalysisResult): string {
  if (result.atsScore >= 80) return "Strong resume with excellent keyword alignment.";
  if (result.atsScore >= 60) return "Good resume but missing some key skills and keywords.";
  if (result.atsScore >= 40) return "Resume needs improvement in keyword matching and formatting.";
  return "Resume needs significant work to pass ATS screening.";
}

// =====================================================
// ANALYSIS ENGINE
// =====================================================

// Expanded skill categories with weights: technical=50%, tools=30%, soft=20%
const SKILL_CATEGORIES = {
  technical: {
    weight: 0.50,
    skills: [
      "react", "angular", "vue", "svelte", "next.js", "nuxt", "gatsby",
      "javascript", "typescript", "python", "java", "c++", "c#", "go", "rust", "ruby", "php", "swift", "kotlin", "scala", "perl", "r",
      "node.js", "express", "django", "flask", "spring", "spring boot", "rails", "laravel", "fastapi", ".net", "asp.net",
      "html", "css", "sass", "less", "tailwind", "bootstrap", "material ui", "chakra ui",
      "sql", "postgresql", "mysql", "mongodb", "redis", "firebase", "supabase", "dynamodb", "cassandra", "elasticsearch", "sqlite",
      "docker", "kubernetes", "aws", "azure", "gcp", "ci/cd", "jenkins", "github actions", "gitlab ci", "circleci", "terraform", "ansible", "puppet",
      "git", "rest api", "graphql", "websocket", "grpc", "microservices", "serverless",
      "machine learning", "deep learning", "tensorflow", "pytorch", "nlp", "ai", "data structures", "computer vision", "neural networks",
      "linux", "bash", "shell scripting", "agile", "scrum", "kanban", "devops", "sre",
      "react native", "flutter", "ionic", "electron",
      "pandas", "numpy", "scipy", "matplotlib", "scikit-learn", "jupyter",
      "hadoop", "spark", "kafka", "rabbitmq",
      "oauth", "jwt", "api gateway", "load balancing",
      "unit testing", "integration testing", "test driven development", "jest", "mocha", "cypress", "selenium",
      "data analysis", "data visualization", "data engineering", "etl", "data warehouse",
      "blockchain", "web3", "smart contracts", "solidity",
    ],
  },
  tools: {
    weight: 0.30,
    skills: [
      "figma", "photoshop", "illustrator", "canva", "adobe xd", "sketch", "invision",
      "ms word", "excel", "powerpoint", "google docs", "google sheets", "google slides",
      "jira", "confluence", "notion", "trello", "slack", "asana", "monday.com", "basecamp",
      "postman", "swagger", "insomnia",
      "vs code", "intellij", "eclipse", "xcode", "android studio",
      "tableau", "power bi", "looker", "google analytics", "mixpanel", "amplitude",
      "salesforce", "hubspot", "zendesk", "intercom",
      "aws console", "azure portal", "gcp console",
      "github", "gitlab", "bitbucket",
      "npm", "yarn", "webpack", "vite", "babel",
      "wordpress", "shopify", "wix", "squarespace",
      "mailchimp", "sendgrid",
      "after effects", "premiere pro", "final cut pro", "davinci resolve",
      "blender", "unity", "unreal engine",
      "sap", "oracle", "erp",
    ],
  },
  soft: {
    weight: 0.20,
    skills: [
      "communication", "teamwork", "problem solving", "leadership",
      "time management", "collaboration", "presentation skills",
      "critical thinking", "adaptability", "creativity",
      "event coordination", "data entry", "documentation",
      "internet research", "basic computer",
      "negotiation", "conflict resolution", "mentoring", "coaching",
      "decision making", "strategic thinking", "analytical thinking",
      "attention to detail", "organizational skills", "multitasking",
      "customer service", "client relations", "stakeholder management",
      "public speaking", "interpersonal skills", "emotional intelligence",
      "self motivation", "initiative", "work ethic", "flexibility",
      "cross functional", "cross-functional collaboration",
      "project management", "change management", "risk management",
      "innovation", "continuous improvement", "process improvement",
    ],
  },
} as const;

// Expanded synonyms map for normalization
const SKILL_SYNONYMS: Record<string, string> = {
  // Office tools
  "microsoft word": "ms word", "ms-word": "ms word", "word": "ms word",
  "microsoft excel": "excel", "ms excel": "excel", "ms-excel": "excel",
  "microsoft powerpoint": "powerpoint", "ms powerpoint": "powerpoint", "ppt": "powerpoint",
  "microsoft office": "ms word", "ms office": "ms word",
  "google workspace": "google docs", "g suite": "google docs",
  
  // Soft skills
  "team work": "teamwork", "team player": "teamwork", "team-oriented": "teamwork",
  "communication skills": "communication", "verbal communication": "communication", "written communication": "communication",
  "problem-solving": "problem solving", "analytical skills": "analytical thinking",
  "computer basics": "basic computer", "computer skills": "basic computer", "computer literacy": "basic computer",
  "time-management": "time management",
  "detail-oriented": "attention to detail", "detail oriented": "attention to detail",
  "self-motivated": "self motivation", "self motivated": "self motivation",
  "multi-tasking": "multitasking", "multi tasking": "multitasking",
  "interpersonal": "interpersonal skills",
  "organizational": "organizational skills",
  "customer support": "customer service", "client support": "customer service",
  
  // Programming languages
  "js": "javascript", "es6": "javascript", "ecmascript": "javascript",
  "ts": "typescript",
  "py": "python", "python3": "python", "python 3": "python",
  "c sharp": "c#", "csharp": "c#",
  "cpp": "c++", "cplusplus": "c++",
  "golang": "go",
  
  // Frameworks
  "react.js": "react", "reactjs": "react",
  "node": "node.js", "nodejs": "node.js", "node js": "node.js",
  "next": "next.js", "nextjs": "next.js", "next js": "next.js",
  "vue.js": "vue", "vuejs": "vue",
  "angular.js": "angular", "angularjs": "angular",
  "express.js": "express", "expressjs": "express",
  "django rest framework": "django", "drf": "django",
  "springboot": "spring boot",
  "dotnet": ".net", "dot net": ".net",
  
  // Cloud / DevOps
  "amazon web services": "aws", "amazon aws": "aws",
  "google cloud": "gcp", "google cloud platform": "gcp",
  "microsoft azure": "azure",
  "continuous integration": "ci/cd", "continuous deployment": "ci/cd", "ci cd": "ci/cd",
  "k8s": "kubernetes",
  "container": "docker", "containerization": "docker",
  
  // APIs
  "restful api": "rest api", "rest apis": "rest api", "restful": "rest api",
  "restful apis": "rest api", "rest-api": "rest api",
  
  // Data
  "postgres": "postgresql", "pg": "postgresql",
  "mongo": "mongodb",
  "elastic search": "elasticsearch",
  "dynamo db": "dynamodb", "dynamo": "dynamodb",
  
  // ML/AI
  "ml": "machine learning", "artificial intelligence": "ai",
  "dl": "deep learning", "natural language processing": "nlp",
  
  // Tools
  "visual studio code": "vs code", "vscode": "vs code",
  "adobe photoshop": "photoshop", "ps": "photoshop",
  "adobe illustrator": "illustrator", "ai (adobe)": "illustrator",
  "adobe xd": "adobe xd",
  
  // Testing
  "tdd": "test driven development",
  "e2e testing": "integration testing", "end to end testing": "integration testing",
  
  // Methodologies
  "scrum master": "scrum", "agile methodology": "agile", "agile development": "agile",
  
  // Version control
  "version control": "git", "source control": "git",
  
  // BI / Analytics
  "business intelligence": "power bi",
  "data analytics": "data analysis",
  "data viz": "data visualization",
};

// Vague wording that hurts ATS / recruiter readability
const VAGUE_TERMS = ["various", "stuff", "things", "etc", "many", "several", "some", "good", "nice", "great"];
const WEAK_VERB_RE = /^\s*[-•*]?\s*(worked on|helped with|helped|did|made|was responsible for|responsible for|assisted with|assisted in|assisted|handled|involved in)\b/i;

function detectEmploymentGaps(text: string): { from: string; to: string; months: number }[] {
  const re = /(19|20)\d{2}\s*[-–to]+\s*((19|20)\d{2}|present|current|now)/gi;
  const ranges: { start: number; end: number; raw: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = m[0];
    const yrs = raw.match(/(19|20)\d{2}/g);
    if (!yrs || yrs.length === 0) continue;
    const start = parseInt(yrs[0], 10);
    const end = yrs[1] ? parseInt(yrs[1], 10) : new Date().getFullYear();
    ranges.push({ start, end, raw });
  }
  if (ranges.length < 2) return [];
  ranges.sort((a, b) => a.start - b.start);
  const gaps: { from: string; to: string; months: number }[] = [];
  for (let i = 1; i < ranges.length; i++) {
    const prev = ranges[i - 1];
    const cur = ranges[i];
    const diff = cur.start - prev.end;
    if (diff >= 1) gaps.push({ from: String(prev.end), to: String(cur.start), months: diff * 12 });
  }
  return gaps;
}

// Flatten all skills
const KNOWN_SKILLS = [
  ...SKILL_CATEGORIES.technical.skills,
  ...SKILL_CATEGORIES.tools.skills,
  ...SKILL_CATEGORIES.soft.skills,
];

const RESUME_SECTIONS = ["summary", "objective", "profile", "experience", "work experience", "employment", "education", "skills", "technical skills", "projects", "certifications", "certificates", "awards", "achievements", "publications", "volunteer", "languages", "interests"];

const CORE_SECTIONS = ["summary", "skills", "experience", "projects", "education"];

const ACTION_VERBS = [
  "achieved", "architected", "built", "created", "delivered", "designed",
  "developed", "drove", "engineered", "established", "executed", "generated",
  "implemented", "improved", "increased", "launched", "led", "managed",
  "optimized", "orchestrated", "pioneered", "reduced", "scaled", "spearheaded",
  "streamlined", "transformed", "automated", "mentored", "coordinated",
  "analyzed", "deployed", "integrated", "migrated", "refactored", "resolved",
];

export function isValidResume(text: string): boolean {
  const t = text.trim();
  if (t.length < 100) return false;
  return t.split(/\s+/).filter(Boolean).length >= 20;
}

export function isValidJobDescription(text: string): boolean {
  const t = text.trim();
  if (t.length < 50) return false;
  return t.split(/\s+/).filter(Boolean).length >= 10;
}

function extractWords(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s.#+\/\-]/g, " ").split(/\s+/).filter((w) => w.length > 1);
}

function normalize(word: string): string {
  return word.replace(/ies$/, "y").replace(/s$/, "");
}

export interface DebugInfo {
  matchedKeywordsCount: number;
  totalJDKeywords: number;
  matchedSkillsCount: number;
  totalRequiredSkills: number;
  sectionsFound: number;
  readabilityRaw: number;
  formulaOutput: number;
  matchedTechnical: string[];
  matchedTools: string[];
  matchedSoft: string[];
  missingTechnical: string[];
  missingTools: string[];
  missingSoft: string[];
}

// Normalize text using synonym map
function normText(text: string): string {
  let t = text;
  // Sort synonyms by length (longest first) to avoid partial replacements
  const sorted = Object.entries(SKILL_SYNONYMS).sort((a, b) => b[0].length - a[0].length);
  for (const [syn, canonical] of sorted) {
    const escaped = syn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), canonical);
  }
  return t;
}

// Check if a multi-word skill is present in text
function skillInText(skill: string, text: string): boolean {
  if (skill.length <= 2) {
    // Very short skills like "r", "c#", "go" — require word boundary
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`\\b${escaped}\\b`, 'i').test(text);
  }
  return text.includes(skill);
}

export function analyzeResume(
  resumeText: string,
  jobDescription: string,
  roastMode: boolean
): { result: AnalysisResult; debug: DebugInfo } {
  const resumeLower = resumeText.toLowerCase();
  const jdLower = jobDescription.toLowerCase();
  const resumeWords = extractWords(resumeText);
  const jdWords = extractWords(jobDescription);

  // Normalize both texts with synonym map
  const resumeNorm = normText(resumeLower);
  const jdNorm = normText(jdLower);

  // --- Keyword Match (weight: 0.35) ---
  // Filter out common stop words for better accuracy
  const stopWords = new Set(["the", "and", "for", "with", "you", "your", "our", "will", "have", "that", "this", "from", "they", "are", "was", "were", "been", "being", "has", "had", "does", "did", "doing", "would", "could", "should", "may", "might", "must", "shall", "can", "need", "dare", "ought", "used", "about", "above", "after", "again", "all", "also", "between", "both", "but", "each", "etc", "not", "only", "other", "some", "such", "than", "too", "very", "just", "because", "into", "through", "during", "before", "while", "then", "more", "most", "what", "which", "who", "whom", "how", "when", "where", "why", "able"]);
  const jdUniqueWords = [...new Set(jdWords.filter((w) => w.length > 3 && !stopWords.has(w)).map(normalize))];
  const resumeNormalized = new Set(resumeWords.map(normalize));
  const matchedKeywords = jdUniqueWords.filter((w) => resumeNormalized.has(w) || resumeNorm.includes(w));
  const keywordMatch = jdUniqueWords.length > 0
    ? Math.round((matchedKeywords.length / jdUniqueWords.length) * 100)
    : 0;

  // --- Skills Match (weight: 0.30) with category weighting ---
  const categoryResults: Record<string, { matched: string[]; missing: string[]; score: number; weight: number }> = {};
  let skillsMatch = 0;
  const allMatchedSkills: string[] = [];
  const allMissingSkills: string[] = [];

  for (const [catName, cat] of Object.entries(SKILL_CATEGORIES)) {
    const jdSkillsCat = cat.skills.filter((s) => skillInText(s, jdNorm));
    const resumeSkillsCat = cat.skills.filter((s) => skillInText(s, resumeNorm));
    const matched = jdSkillsCat.filter((s) => resumeSkillsCat.includes(s));
    const missing = jdSkillsCat.filter((s) => !resumeSkillsCat.includes(s));
    const score = jdSkillsCat.length > 0 ? (matched.length / jdSkillsCat.length) * 100 : -1;
    categoryResults[catName] = { matched, missing, score, weight: cat.weight };
    allMatchedSkills.push(...matched);
    allMissingSkills.push(...missing);
  }

  // Weighted average across categories that have JD skills
  const activeCats = Object.values(categoryResults).filter((c) => c.score >= 0);
  if (activeCats.length > 0) {
    const totalWeight = activeCats.reduce((a, c) => a + c.weight, 0);
    skillsMatch = Math.round(activeCats.reduce((a, c) => a + (c.score * c.weight / totalWeight), 0));
  }

  const matchedSkills = allMatchedSkills;
  const missingSkills = allMissingSkills;
  const jdSkills = KNOWN_SKILLS.filter((s) => skillInText(s, jdNorm));

  // --- Formatting Quality (weight: 0.15) ---
  // Check for section headings more robustly using line-by-line detection
  const resumeLines = resumeText.split("\n").map(l => l.trim()).filter(l => l);
  let formattingScore = 0;
  const sectionPatterns: Record<string, RegExp> = {
    summary: /\b(summary|profile|about\s*me|professional\s*summary|career\s*summary|objective)\b/i,
    skills: /\b(skills|technical\s*skills|core\s*competencies|competencies|proficiencies)\b/i,
    experience: /\b(experience|work\s*experience|employment|professional\s*experience|work\s*history)\b/i,
    projects: /\b(projects|personal\s*projects|academic\s*projects|key\s*projects)\b/i,
    education: /\b(education|academic|qualifications|degrees)\b/i,
  };

  const detectedSections = new Set<string>();
  for (const line of resumeLines) {
    // Section headings are usually short lines (< 50 chars) or ALL CAPS
    const isHeadingLike = line.length < 60 || line === line.toUpperCase();
    if (isHeadingLike) {
      for (const [section, pattern] of Object.entries(sectionPatterns)) {
        if (pattern.test(line)) {
          detectedSections.add(section);
        }
      }
    }
  }
  // Also do a simple includes check as fallback
  for (const [section, pattern] of Object.entries(sectionPatterns)) {
    if (pattern.test(resumeLower)) {
      detectedSections.add(section);
    }
  }
  formattingScore = Math.min(Math.round((detectedSections.size / 5) * 100), 100);

  // --- Readability (weight: 0.15) ---
  const lines = resumeText.split("\n").filter((l) => l.trim());
  const bulletLines = lines.filter((l) => /^\s*[-•*▪▸►◦]/.test(l) || /^\s*\d+[.)]/.test(l));
  const sentences = resumeText.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const avgSentenceLength = sentences.length > 0
    ? sentences.reduce((a, s) => a + s.trim().split(/\s+/).length, 0) / sentences.length
    : 0;

  let readabilityScore = 0;
  // Bullet points (max 30)
  if (bulletLines.length >= 8) readabilityScore += 30;
  else if (bulletLines.length >= 5) readabilityScore += 25;
  else if (bulletLines.length >= 2) readabilityScore += 15;
  else if (bulletLines.length >= 1) readabilityScore += 8;
  // Sentence length between 8-25 words is ideal (max 25)
  if (avgSentenceLength >= 8 && avgSentenceLength <= 25) readabilityScore += 25;
  else if (avgSentenceLength > 0 && avgSentenceLength < 40) readabilityScore += 12;
  else if (avgSentenceLength > 0) readabilityScore += 5;
  // Section headings present (max 20)
  if (detectedSections.size >= 4) readabilityScore += 20;
  else if (detectedSections.size >= 3) readabilityScore += 15;
  else if (detectedSections.size >= 2) readabilityScore += 10;
  else if (detectedSections.size >= 1) readabilityScore += 5;
  // No giant paragraph blocks (max 15)
  const longBlocks = resumeText.split(/\n\s*\n/).filter((b) => b.split("\n").length > 8);
  if (longBlocks.length === 0) readabilityScore += 15;
  else if (longBlocks.length <= 2) readabilityScore += 8;
  else readabilityScore += 3;
  // Action verbs (max 10)
  const usedVerbs = ACTION_VERBS.filter((v) => resumeLower.includes(v));
  if (usedVerbs.length >= 5) readabilityScore += 10;
  else if (usedVerbs.length >= 3) readabilityScore += 7;
  else if (usedVerbs.length >= 1) readabilityScore += 4;
  readabilityScore = Math.min(readabilityScore, 100);

  // --- Section Completeness (weight: 0.05) ---
  const sectionCompleteness = Math.min(Math.round((detectedSections.size / 5) * 100), 100);

  // --- Parseability (weight: 0.15) ---
  // Heuristic: penalize when bullets missing, no headings detected,
  // suspicious 2-column layout (very long lines), or low text/whitespace ratio.
  let parseability = 100;
  if (bulletLines.length === 0) parseability -= 12;
  if (detectedSections.size === 0) parseability -= 10;
  // 2-column detection: many lines with 3+ runs separated by 4+ spaces
  const twoColLines = resumeText.split("\n").filter((l) => /\S(?: {4,}|\t+)\S.*(?: {4,}|\t+)\S/.test(l)).length;
  if (twoColLines >= 5) parseability -= 8;
  // Heavy graphics / unparseable signal: very few alpha chars
  const alpha = (resumeText.match(/[A-Za-z]/g) || []).length;
  if (resumeText.length > 0 && alpha / resumeText.length < 0.55) parseability -= 5;
  // Unreadable: text very short overall
  if (resumeText.replace(/\s+/g, "").length < 300) parseability -= 10;
  parseability = Math.max(0, Math.min(100, parseability));

  // --- Achievement Quality (weight: 0.05) ---
  const allBulletsForAch = resumeText.split("\n").filter((l) => /^\s*[-•*▪▸►◦]/.test(l) || /^\s*\d+[.)]/.test(l));
  const quantBullets = allBulletsForAch.filter((l) => /\d+%|\$\s?\d|\d{2,}|\d+\+/.test(l)).length;
  const weakOpener = allBulletsForAch.filter((l) => WEAK_VERB_RE.test(l)).length;
  const vagueCount = VAGUE_TERMS.reduce((a, t) => a + (new RegExp(`\\b${t}\\b`, "i").test(resumeText) ? 1 : 0), 0);
  let achievementQuality = 0;
  if (allBulletsForAch.length > 0) {
    achievementQuality = Math.round((quantBullets / allBulletsForAch.length) * 80);
    achievementQuality += Math.min(20, allBulletsForAch.length * 2);
  } else if (/\d+%|\$\s?\d|\d+\+/.test(resumeText)) {
    achievementQuality = 40;
  }
  achievementQuality -= weakOpener * 4;
  achievementQuality -= vagueCount * 2;
  achievementQuality = Math.max(0, Math.min(100, achievementQuality));

  // --- ATS Score (transparent weighted formula) ---
  let rawAts =
    keywordMatch * 0.35 +
    skillsMatch * 0.20 +
    parseability * 0.15 +
    formattingScore * 0.10 +
    readabilityScore * 0.10 +
    sectionCompleteness * 0.05 +
    achievementQuality * 0.05;

  // Realistic caps
  if (keywordMatch < 30) rawAts = Math.min(rawAts, 60);
  else if (keywordMatch < 50) rawAts = Math.min(rawAts, 75);
  if (skillsMatch < 40) rawAts -= 5;

  const atsScore = Math.max(0, Math.min(100, Math.round(rawAts)));

  // --- Score breakdown (explainability) ---
  const scoreBreakdown: ScoreBreakdownItem[] = [];
  const pushPos = (label: string, delta: number) => { if (delta > 0) scoreBreakdown.push({ label, delta, positive: true }); };
  const pushNeg = (label: string, delta: number) => { if (delta > 0) scoreBreakdown.push({ label, delta: -delta, positive: false }); };

  // Positive contributions
  pushPos(`Keyword match (${keywordMatch}%)`, Math.round(keywordMatch * 0.35));
  pushPos(`Skills match (${skillsMatch}%)`, Math.round(skillsMatch * 0.20));
  pushPos(`Parseability (${parseability}%)`, Math.round(parseability * 0.15));
  pushPos(`Formatting (${formattingScore}%)`, Math.round(formattingScore * 0.10));
  pushPos(`Readability (${readabilityScore}%)`, Math.round(readabilityScore * 0.10));
  pushPos(`Section completeness (${sectionCompleteness}%)`, Math.round(sectionCompleteness * 0.05));
  pushPos(`Achievement quality (${achievementQuality}%)`, Math.round(achievementQuality * 0.05));

  // Negative call-outs
  if (skillsMatch < 40) pushNeg("Skills match under 40% applied −5 penalty", 5);
  if (keywordMatch < 30) scoreBreakdown.push({ label: "Low keyword match — ATS capped at 60", delta: 0, positive: false });
  else if (keywordMatch < 50) scoreBreakdown.push({ label: "Keyword match below 50% — ATS capped at 75", delta: 0, positive: false });
  if (missingSkills.length > 0) pushNeg(`Missing ${missingSkills.length} required skill${missingSkills.length > 1 ? "s" : ""}`, Math.min(15, missingSkills.length * 2));
  if (bulletLines.length === 0) pushNeg("No bullet points detected", 12);
  if (twoColLines >= 5) pushNeg("Two-column layout detected", 8);
  if (weakOpener > 0) pushNeg(`${weakOpener} weak bullet opener${weakOpener > 1 ? "s" : ""}`, weakOpener * 4);
  if (vagueCount > 0) pushNeg(`${vagueCount} vague term${vagueCount > 1 ? "s" : ""} found`, vagueCount * 2);
  if (!detectedSections.has("summary")) pushNeg("No professional summary", 5);

  // --- Actionable Suggestions ---
  const actionableSuggestions: ActionableSuggestion[] = [];
  const suggestions: string[] = [];

  if (!detectedSections.has("summary")) {
    const s = "Add a professional summary section at the top of your resume to give recruiters a quick overview.";
    suggestions.push(s);
    actionableSuggestions.push({
      title: "Add Professional Summary",
      reason: "A professional summary is the first thing recruiters read. Without it, your resume lacks context and may be skipped by ATS systems.",
      fix: "Add a 2-3 sentence summary at the top of your resume highlighting your experience level, key skills, and career objective for this role.",
    });
  }

  if (!/\d+%/.test(resumeText) && !/\$\d/.test(resumeText) && !/\d+\+/.test(resumeText)) {
    const s = "Include measurable achievements with numbers, percentages, or dollar amounts.";
    suggestions.push(s);
    actionableSuggestions.push({
      title: "Add Measurable Achievements",
      reason: "Quantified results prove your impact. Resumes with numbers are 40% more likely to get interview callbacks.",
      fix: "Add metrics to your experience bullets. Example: 'Improved page load speed by 35%' or 'Managed a team of 8 engineers' or 'Reduced customer churn by 20%'.",
    });
  }

  if (missingSkills.length > 0) {
    const top = missingSkills.slice(0, 4).map(s => s.charAt(0).toUpperCase() + s.slice(1));
    suggestions.push(`Add missing skills: ${top.join(", ")}.`);
    for (const skill of missingSkills.slice(0, 5)) {
      const capSkill = skill.charAt(0).toUpperCase() + skill.slice(1);
      actionableSuggestions.push({
        title: `Add Missing Skill: ${capSkill}`,
        reason: `The job description requires ${capSkill}, but it was not found in your resume. This directly impacts your ATS keyword score.`,
        fix: `Add ${capSkill} experience from your academic work, personal projects, or professional experience in your Skills or relevant Experience section.`,
      });
    }
  }

  if (usedVerbs.length < 3) {
    const s = "Use stronger action verbs like 'Architected', 'Spearheaded', 'Optimized'.";
    suggestions.push(s);
    actionableSuggestions.push({
      title: "Improve Action Verbs",
      reason: "Weak verbs like 'Worked on' or 'Helped with' don't demonstrate ownership. Strong action verbs convey leadership and initiative.",
      fix: "Replace weak verbs with impactful ones: 'Worked on' → 'Developed', 'Helped with' → 'Collaborated on', 'Did' → 'Executed'. Start every bullet point with a past-tense action verb.",
    });
  }

  if (!detectedSections.has("projects")) {
    const s = "Add a Projects section showcasing relevant work.";
    suggestions.push(s);
    actionableSuggestions.push({
      title: "Add Projects Section",
      reason: "A Projects section demonstrates practical application of your skills and is especially important for early-career professionals.",
      fix: "Add 2-3 relevant projects with: project name, technologies used, your role, and measurable outcomes. Include links to GitHub or live demos if available.",
    });
  }

  if (!/certif/i.test(resumeText)) {
    const s = "Consider adding relevant certifications to strengthen your profile.";
    suggestions.push(s);
    actionableSuggestions.push({
      title: "Add Certifications",
      reason: "Certifications validate your expertise and add ATS-relevant keywords that boost your score.",
      fix: "List relevant certifications with the issuing organization and date. Examples: AWS Certified Developer, Google Analytics Certified, PMP, Scrum Master.",
    });
  }

  if (formattingScore < 60) {
    const s = "Improve resume formatting by adding clear section headers (Summary, Skills, Experience, Education, Projects).";
    suggestions.push(s);
    actionableSuggestions.push({
      title: "Fix Section Headers",
      reason: "ATS systems rely on section headers to parse your resume. Missing or non-standard headers cause parsing failures.",
      fix: "Use standard section headers: 'Professional Summary', 'Skills', 'Experience', 'Education', 'Projects'. Make them bold and on their own line.",
    });
  }

  if (bulletLines.length < 3) {
    actionableSuggestions.push({
      title: "Add Bullet Points",
      reason: "Resumes without bullet points are harder to scan and ATS systems may miss key information in paragraph format.",
      fix: "Convert your experience descriptions into bullet points. Each bullet should start with an action verb and describe one accomplishment or responsibility.",
    });
  }

  if (resumeText.length < 400) {
    actionableSuggestions.push({
      title: "Expand Resume Content",
      reason: "Your resume appears too short. Brief resumes suggest lack of experience or effort, and provide fewer keywords for ATS matching.",
      fix: "Aim for at least 400-600 words. Add more detail to your experience bullets, include a summary, and list all relevant skills and projects.",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push("Your resume covers the basics well. Focus on quantifying achievements and tailoring keywords.");
  }

  // --- Roast ---
  const roastFeedback: string[] = [];
  if (roastMode) {
    if (!/\d/.test(resumeText)) roastFeedback.push("No numbers anywhere? Did you never measure anything you did?");
    if (bulletLines.length < 3) roastFeedback.push("Where are your bullet points? A wall of text won't impress anyone.");
    if (detectedSections.size < 3) roastFeedback.push("Your resume is missing major sections. It looks incomplete.");
    if (usedVerbs.length < 2) roastFeedback.push("Your bullet points start with weak verbs. Show impact, not duties.");
    if (missingSkills.length > 3) roastFeedback.push(`You're missing ${missingSkills.length} skills from the JD. That's a big gap.`);
    if (resumeText.length < 300) roastFeedback.push("This resume is shorter than a tweet thread. Put in more effort.");
    if (keywordMatch < 30) roastFeedback.push("Did you even read the job description? Your keyword match is embarrassing.");
    if (roastFeedback.length === 0) roastFeedback.push("Not bad! But there's always room to make it more impactful.");
  }

  // --- Bullet improvements ---
  const strongBullets: { original: string; improved: string }[] = [];
  const weakBullets = lines
    .filter((l) => l.trim().length > 15 && l.trim().length < 120)
    .filter((l) => /^\s*[-•*]/.test(l) || /^(worked|helped|did|made|was responsible|assisted|handled)/i.test(l.trim()))
    .slice(0, 3);
  for (const wb of weakBullets) {
    const clean = wb.replace(/^\s*[-•*]+\s*/, "").trim();
    const verb = ACTION_VERBS[Math.floor(Math.random() * ACTION_VERBS.length)];
    const cap = verb.charAt(0).toUpperCase() + verb.slice(1);
    strongBullets.push({
      original: clean,
      improved: `${cap} ${clean.charAt(0).toLowerCase()}${clean.slice(1)}${/\d/.test(clean) ? "" : ", resulting in measurable impact"}`,
    });
  }

  const result: AnalysisResult = {
    atsScore,
    keywordMatch,
    skillsMatch,
    formattingScore,
    readabilityScore,
    sectionCompleteness,
    matchedSkills: matchedSkills.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    missingSkills: missingSkills.map((s) => s.charAt(0).toUpperCase() + s.slice(1)),
    suggestions,
    actionableSuggestions,
    roastFeedback,
    strongBullets,
  };

  // ---- Career Copilot extras ----
  // Partial skills: present in resume but not exact JD skill — synonym/related matches
  const partialSkills: string[] = [];
  for (const m of matchedSkills) {
    // already exact — skip
  }
  for (const [, syn] of Object.entries(SKILL_SYNONYMS)) {
    if (resumeNorm.includes(syn) && jdLower.includes(syn) && !matchedSkills.includes(syn)) {
      if (!partialSkills.includes(syn)) partialSkills.push(syn);
    }
  }

  // Weak bullets
  const allLines = resumeText.split("\n").map((l) => l.trim()).filter((l) => l.length > 12);
  const weakBulletList = allLines.filter((l) => WEAK_VERB_RE.test(l)).slice(0, 8);

  // Vague terms
  const vagueFound: string[] = [];
  for (const t of VAGUE_TERMS) {
    if (new RegExp(`\\b${t}\\b`, "i").test(resumeText)) vagueFound.push(t);
  }

  // Keyword stuffing — same skill repeated > 5x
  const stuffed: { keyword: string; count: number }[] = [];
  for (const sk of matchedSkills) {
    const m = resumeNorm.match(new RegExp(`\\b${sk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"));
    if (m && m.length > 5) stuffed.push({ keyword: sk, count: m.length });
  }

  // Quantified ratio — % of bullets containing numbers/%/$
  const quantified = bulletLines.filter((l) => /\d/.test(l)).length;
  const quantifiedRatio = bulletLines.length > 0 ? Math.round((quantified / bulletLines.length) * 100) : 0;

  // Employment gaps
  const employmentGaps = detectEmploymentGaps(resumeText);

  // Recruiter scan score: readability + achievement + formatting + bullets + sections
  const bulletQuality = bulletLines.length === 0
    ? 0
    : Math.min(100, Math.round((bulletLines.length >= 8 ? 100 : (bulletLines.length / 8) * 100) - weakOpener * 8));
  const recruiterScanScore = Math.max(0, Math.min(100, Math.round(
    readabilityScore * 0.30 +
    achievementQuality * 0.30 +
    formattingScore * 0.15 +
    Math.max(0, bulletQuality) * 0.15 +
    sectionCompleteness * 0.10
  )));

  // Job readiness
  const jobReadiness = Math.min(100, Math.round(
    atsScore * 0.4 + skillsMatch * 0.3 + sectionCompleteness * 0.15 + readabilityScore * 0.15
  ));

  // Strengths / weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  if (skillsMatch >= 70) strengths.push("Strong skills alignment");
  if (matchedSkills.length >= 5) strengths.push(`${matchedSkills.length} relevant skills detected`);
  if (detectedSections.has("projects")) strengths.push("Projects section present");
  if (quantifiedRatio >= 40) strengths.push("Good use of measurable achievements");
  if (usedVerbs.length >= 5) strengths.push("Uses strong action verbs");
  if (missingSkills.length > 3) weaknesses.push(`Missing ${missingSkills.length} key skills`);
  if (!detectedSections.has("summary")) weaknesses.push("No professional summary");
  if (quantifiedRatio < 20) weaknesses.push("Few measurable achievements");
  if (weakBulletList.length >= 2) weaknesses.push(`${weakBulletList.length} weak bullet points`);
  if (stuffed.length > 0) weaknesses.push("Possible keyword stuffing");
  if (employmentGaps.length > 0) weaknesses.push(`${employmentGaps.length} employment gap${employmentGaps.length > 1 ? "s" : ""} detected`);

  result.partialSkills = partialSkills.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
  result.weakBullets = weakBulletList;
  result.vagueTerms = vagueFound;
  result.stuffedKeywords = stuffed;
  result.quantifiedRatio = quantifiedRatio;
  result.employmentGaps = employmentGaps;
  result.recruiterScanScore = recruiterScanScore;
  result.jobReadiness = jobReadiness;
  result.strengths = strengths;
  result.weaknesses = weaknesses;
  result.resumeText = resumeText;
  result.jobDescription = jobDescription;
  result.parseability = parseability;
  result.achievementQuality = achievementQuality;
  result.scoreBreakdown = scoreBreakdown;

  const debug: DebugInfo = {
    matchedKeywordsCount: matchedKeywords.length,
    totalJDKeywords: jdUniqueWords.length,
    matchedSkillsCount: matchedSkills.length,
    totalRequiredSkills: jdSkills.length,
    sectionsFound: detectedSections.size,
    readabilityRaw: readabilityScore,
    formulaOutput: atsScore,
    matchedTechnical: categoryResults.technical?.matched || [],
    matchedTools: categoryResults.tools?.matched || [],
    matchedSoft: categoryResults.soft?.matched || [],
    missingTechnical: categoryResults.technical?.missing || [],
    missingTools: categoryResults.tools?.missing || [],
    missingSoft: categoryResults.soft?.missing || [],
  };

  return { result, debug };
}
