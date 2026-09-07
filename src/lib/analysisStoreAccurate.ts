import { analyzeResume as legacyAnalyzeResume, type AnalysisResult, type ScoreBreakdownItem } from "./analysisStore";
import { buildScoreBreakdown } from "./scoreBreakdown";

export * from "./analysisStore";

const SKILLS = {
  technical: [
    "react","angular","vue","svelte","next.js","nuxt","gatsby","javascript","typescript","python","java","c++","c#","go","rust","ruby","php","swift","kotlin","scala","perl","r","node.js","express","django","flask","spring","spring boot","rails","laravel","fastapi",".net","asp.net","html","css","sass","less","tailwind","bootstrap","material ui","chakra ui","sql","postgresql","mysql","mongodb","redis","firebase","supabase","dynamodb","cassandra","elasticsearch","sqlite","docker","kubernetes","aws","azure","gcp","ci/cd","jenkins","github actions","gitlab ci","circleci","terraform","ansible","puppet","git","rest api","graphql","websocket","grpc","microservices","serverless","machine learning","deep learning","tensorflow","pytorch","nlp","ai","data structures","computer vision","neural networks","linux","bash","shell scripting","agile","scrum","kanban","devops","sre","react native","flutter","ionic","electron","pandas","numpy","scipy","matplotlib","scikit-learn","jupyter","hadoop","spark","kafka","rabbitmq","oauth","jwt","api gateway","load balancing","unit testing","integration testing","test driven development","jest","mocha","cypress","selenium","data analysis","data visualization","data engineering","etl","data warehouse","blockchain","web3","smart contracts","solidity",
  ],
  tools: [
    "figma","photoshop","illustrator","canva","adobe xd","sketch","invision","ms word","excel","powerpoint","google docs","google sheets","google slides","jira","confluence","notion","trello","slack","asana","monday.com","basecamp","postman","swagger","insomnia","vs code","intellij","eclipse","xcode","android studio","tableau","power bi","looker","google analytics","mixpanel","amplitude","salesforce","hubspot","zendesk","intercom","aws console","azure portal","gcp console","github","gitlab","bitbucket","npm","yarn","webpack","vite","babel","wordpress","shopify","wix","squarespace","mailchimp","sendgrid","after effects","premiere pro","final cut pro","davinci resolve","blender","unity","unreal engine","sap","oracle","erp",
  ],
  soft: [
    "communication","teamwork","problem solving","leadership","time management","collaboration","presentation skills","critical thinking","adaptability","creativity","event coordination","data entry","documentation","internet research","basic computer","negotiation","conflict resolution","mentoring","coaching","decision making","strategic thinking","analytical thinking","attention to detail","organizational skills","multitasking","customer service","client relations","stakeholder management","public speaking","interpersonal skills","emotional intelligence","self motivation","initiative","work ethic","flexibility","cross functional","cross-functional collaboration","project management","change management","risk management","innovation","continuous improvement","process improvement",
  ],
} as const;

const WEIGHTS = { technical: 0.5, tools: 0.3, soft: 0.2 } as const;

const ALIASES: Record<string,string> = {
  "react.js":"react", reactjs:"react", "vue.js":"vue", vuejs:"vue", "angular.js":"angular", angularjs:"angular",
  js:"javascript", es6:"javascript", ecmascript:"javascript", ts:"typescript", py:"python", python3:"python", "python 3":"python",
  "c sharp":"c#", csharp:"c#", cpp:"c++", cplusplus:"c++", golang:"go",
  node:"node.js", nodejs:"node.js", "node js":"node.js", next:"next.js", nextjs:"next.js", "next js":"next.js",
  expressjs:"express", "express.js":"express", springboot:"spring boot", dotnet:".net", "dot net":".net",
  "amazon web services":"aws", "amazon aws":"aws", "google cloud":"gcp", "google cloud platform":"gcp", "microsoft azure":"azure",
  "continuous integration":"ci/cd", "continuous deployment":"ci/cd", "ci cd":"ci/cd", k8s:"kubernetes",
  "restful api":"rest api", "rest apis":"rest api", restful:"rest api", "restful apis":"rest api", "rest-api":"rest api",
  postgres:"postgresql", mongo:"mongodb", "elastic search":"elasticsearch", "dynamo db":"dynamodb",
  ml:"machine learning", "artificial intelligence":"ai", dl:"deep learning", "natural language processing":"nlp",
  "visual studio code":"vs code", vscode:"vs code", "adobe photoshop":"photoshop", "adobe illustrator":"illustrator",
  tdd:"test driven development", "scrum master":"scrum", "agile methodology":"agile", "agile development":"agile",
  "team work":"teamwork", "team player":"teamwork", "communication skills":"communication", "problem-solving":"problem solving",
  "time-management":"time management", "detail-oriented":"attention to detail", "detail oriented":"attention to detail",
  "self-motivated":"self motivation", "self motivated":"self motivation", "multi-tasking":"multitasking", "multi tasking":"multitasking",
  interpersonal:"interpersonal skills", organizational:"organizational skills", "customer support":"customer service", "client support":"customer service",
};

const GENERIC = new Set([
  "the","and","for","with","you","your","our","will","have","that","this","from","they","are","was","were","been","being","has","had","does","did","doing","would","could","should","may","might","must","shall","can","need","about","above","after","again","all","also","between","both","but","each","etc","not","only","other","some","such","than","too","very","just","because","into","through","during","before","while","then","more","most","what","which","who","whom","how","when","where","why","able","strong","required","preferred","looking","candidate","role","position","responsibilities","responsibility","including","using","used","work","working","team","teams","company","organization","environment","experience","years","year","skills","skill","knowledge","ability","abilities","excellent","good","great","high","quality","results","develop","developing","developer","development","applications","application","software","technology","technologies","container","word","version","control","business","intelligence","analytics",
]);

const normalize = (text:string) => {
  let out = text.toLowerCase();
  for (const [alias, canonical] of Object.entries(ALIASES).sort((a,b)=>b[0].length-a[0].length)) {
    const pattern = new RegExp(`(^|[^a-z0-9+#.])${alias.replace(/[.*+?^${}()|[\\]\\]/g,"\\$&")}(?=$|[^a-z0-9+#.])`,"gi");
    out = out.replace(pattern, `$1${canonical}`);
  }
  return out.replace(/\s+/g," ").trim();
};

const contains = (skill:string, text:string) => {
  const s = skill.toLowerCase();
  if (s === "r") return /(^|[^a-z])r([^a-z]|$)/i.test(text);
  if (s === "go") return /(^|[^a-z])go([^a-z]|$)/i.test(text);
  return new RegExp(`(^|[^a-z0-9+#.])${s.replace(/[.*+?^${}()|[\\]\\]/g,"\\$&")}(?=$|[^a-z0-9+#.])`,"i").test(text);
};

function getSkillMatches(resume:string, jd:string) {
  const resumeNorm = normalize(resume);
  const jdNorm = normalize(jd);
  const matched:string[]=[];
  const missing:string[]=[];
  const categoryScores:Record<string,{matched:string[];missing:string[]}> = {};

  for (const [category, skills] of Object.entries(SKILLS)) {
    const required = skills.filter((skill) => contains(skill, jdNorm));
    const m = required.filter((skill) => contains(skill, resumeNorm));
    const miss = required.filter((skill) => !contains(skill, resumeNorm));
    categoryScores[category] = { matched:m, missing:miss };
    matched.push(...m); missing.push(...miss);
  }

  const score = Object.entries(WEIGHTS).reduce((sum,[category,weight]) => {
    const data = categoryScores[category];
    const total = data.matched.length + data.missing.length;
    return sum + (total ? (data.matched.length / total) * 100 * weight : 100 * weight);
  },0);

  return { matched:[...new Set(matched)], missing:[...new Set(missing)], skillsMatch:Math.round(score), categoryScores, resumeNorm, jdNorm };
}

function getKeywordMatch(resumeNorm:string, jdNorm:string, knownSkills:string[]) {
  const words = jdNorm.split(/[^a-z0-9+#.]+/i).filter(Boolean);
  const stop = new Set([...GENERIC, "strong","also","etc","preferred","required","including","responsible","responsibilities"]);
  const terms = [...new Set(words.filter(w => w.length >= 4 && !stop.has(w)))];
  const meaningful = [...new Set([...knownSkills.filter(s=>contains(s,jdNorm)), ...terms])];
  const matched = meaningful.filter(term => contains(term,resumeNorm));
  return meaningful.length ? Math.round((matched.length / meaningful.length) * 100) : 0;
}

export function analyzeResume(resumeText:string, jobDescription:string, roastMode=false): { result: AnalysisResult; debug: any } {
  const { result: legacy } = legacyAnalyzeResume(resumeText, jobDescription, roastMode);
  const skills = getSkillMatches(resumeText, jobDescription);
  const keywordMatch = getKeywordMatch(skills.resumeNorm, skills.jdNorm, [...skills.matched, ...skills.missing]);

  let rawAts =
    keywordMatch * 0.35 +
    skills.skillsMatch * 0.20 +
    (legacy.parseability ?? 100) * 0.15 +
    legacy.formattingScore * 0.10 +
    legacy.readabilityScore * 0.10 +
    legacy.sectionCompleteness * 0.05 +
    (legacy.achievementQuality ?? 0) * 0.05;
  if (keywordMatch < 30) rawAts = Math.min(rawAts, 60);
  else if (keywordMatch < 50) rawAts = Math.min(rawAts, 75);
  if (skills.skillsMatch < 40) rawAts -= 5;

  const atsScore = Math.max(0, Math.min(100, Math.round(rawAts)));
  const next: AnalysisResult = {
    ...legacy,
    atsScore,
    keywordMatch,
    skillsMatch: skills.skillsMatch,
    matchedSkills: skills.matched.map(s => s.charAt(0).toUpperCase()+s.slice(1)),
    missingSkills: skills.missing.map(s => s.charAt(0).toUpperCase()+s.slice(1)),
  };
  next.scoreBreakdown = buildScoreBreakdown(next);

  return {
    result: next,
    debug: {
      matchedKeywordsCount: 0,
      totalJDKeywords: 0,
      matchedSkillsCount: skills.matched.length,
      totalRequiredSkills: skills.matched.length + skills.missing.length,
      sectionsFound: 0,
      readabilityRaw: legacy.readabilityScore,
      formulaOutput: atsScore,
      matchedTechnical: skills.categoryScores.technical?.matched || [],
      matchedTools: skills.categoryScores.tools?.matched || [],
      matchedSoft: skills.categoryScores.soft?.matched || [],
      missingTechnical: skills.categoryScores.technical?.missing || [],
      missingTools: skills.categoryScores.tools?.missing || [],
      missingSoft: skills.categoryScores.soft?.missing || [],
    },
  };
}
