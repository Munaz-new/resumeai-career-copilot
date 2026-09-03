import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { MessageSquareText, BookOpen, Brain, ArrowRight, Users, Zap, Award } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getLastAnalysis } from "@/lib/analysisStore";
import { buildPrepPlan } from "@/lib/interviewPrep";
import { cn } from "@/lib/utils";

const SKILL_QUESTIONS: Record<string, { question: string; difficulty: "Easy" | "Medium" | "Hard" }[]> = {
  docker: [
    { question: "What is the difference between a Docker image and a container?", difficulty: "Easy" },
    { question: "How would you set up a multi-container application using Docker Compose?", difficulty: "Medium" },
    { question: "Describe strategies for optimizing Docker image sizes in production.", difficulty: "Hard" },
  ],
  aws: [
    { question: "What is the difference between EC2 and Lambda?", difficulty: "Easy" },
    { question: "How would you set up a CI/CD pipeline on AWS?", difficulty: "Medium" },
    { question: "Design a highly available architecture using multiple AWS services.", difficulty: "Hard" },
  ],
  kubernetes: [
    { question: "What is a Kubernetes pod?", difficulty: "Easy" },
    { question: "How do you handle horizontal scaling in Kubernetes?", difficulty: "Medium" },
    { question: "Explain service mesh and when you'd implement one in Kubernetes.", difficulty: "Hard" },
  ],
  react: [
    { question: "What are React hooks and why were they introduced?", difficulty: "Easy" },
    { question: "Explain the virtual DOM and reconciliation process.", difficulty: "Medium" },
    { question: "How would you architect state management for a large-scale React application?", difficulty: "Hard" },
  ],
  typescript: [
    { question: "What are the benefits of TypeScript over JavaScript?", difficulty: "Easy" },
    { question: "Explain generic types and when you'd use them.", difficulty: "Medium" },
    { question: "How do you create advanced utility types using conditional types?", difficulty: "Hard" },
  ],
  javascript: [
    { question: "What is the difference between var, let, and const?", difficulty: "Easy" },
    { question: "Explain closures and how they work in JavaScript.", difficulty: "Medium" },
    { question: "How does the JavaScript event loop handle microtasks vs macrotasks?", difficulty: "Hard" },
  ],
  python: [
    { question: "What are Python decorators?", difficulty: "Easy" },
    { question: "Explain the GIL and its impact on multithreading.", difficulty: "Medium" },
    { question: "How would you optimize a memory-intensive Python application?", difficulty: "Hard" },
  ],
  java: [
    { question: "What is the difference between JDK, JRE, and JVM?", difficulty: "Easy" },
    { question: "Explain garbage collection in Java.", difficulty: "Medium" },
    { question: "Describe the SOLID principles with practical Java examples.", difficulty: "Hard" },
  ],
  "node.js": [
    { question: "What is the event loop in Node.js?", difficulty: "Easy" },
    { question: "How do you handle errors in async Node.js code?", difficulty: "Medium" },
    { question: "Describe streaming in Node.js and backpressure handling.", difficulty: "Hard" },
  ],
  sql: [
    { question: "What is the difference between INNER JOIN and LEFT JOIN?", difficulty: "Easy" },
    { question: "How do you optimize a slow SQL query?", difficulty: "Medium" },
    { question: "Explain query execution plans and indexing strategies.", difficulty: "Hard" },
  ],
  git: [
    { question: "What is the difference between merge and rebase?", difficulty: "Easy" },
    { question: "How do you resolve merge conflicts?", difficulty: "Medium" },
    { question: "Describe your ideal Git branching strategy for a team.", difficulty: "Hard" },
  ],
  "rest api": [
    { question: "What are REST API principles?", difficulty: "Easy" },
    { question: "How would you design API versioning?", difficulty: "Medium" },
    { question: "How would you optimize REST API performance at scale?", difficulty: "Hard" },
  ],
  "machine learning": [
    { question: "What is the difference between supervised and unsupervised learning?", difficulty: "Easy" },
    { question: "How do you handle overfitting?", difficulty: "Medium" },
    { question: "Explain the bias-variance tradeoff in model selection.", difficulty: "Hard" },
  ],
  mongodb: [
    { question: "What is the difference between SQL and NoSQL databases?", difficulty: "Easy" },
    { question: "How do you design schemas in MongoDB?", difficulty: "Medium" },
    { question: "Explain MongoDB sharding and replication strategies.", difficulty: "Hard" },
  ],
  graphql: [
    { question: "What is GraphQL and how does it differ from REST?", difficulty: "Easy" },
    { question: "How do you handle N+1 queries in GraphQL?", difficulty: "Medium" },
    { question: "Design a GraphQL schema for a complex e-commerce system.", difficulty: "Hard" },
  ],
  "ci/cd": [
    { question: "What is the difference between CI and CD?", difficulty: "Easy" },
    { question: "How would you set up automated testing in a CI pipeline?", difficulty: "Medium" },
    { question: "Describe a zero-downtime deployment strategy.", difficulty: "Hard" },
  ],
  "c++": [
    { question: "What is the difference between stack and heap memory?", difficulty: "Easy" },
    { question: "Explain smart pointers and RAII in C++.", difficulty: "Medium" },
    { question: "How do you handle memory management in a multithreaded C++ application?", difficulty: "Hard" },
  ],
  postgresql: [
    { question: "What are the advantages of PostgreSQL over MySQL?", difficulty: "Easy" },
    { question: "How do you use indexes to optimize query performance?", difficulty: "Medium" },
    { question: "Explain PostgreSQL partitioning strategies and when to use them.", difficulty: "Hard" },
  ],
  figma: [
    { question: "What are components and variants in Figma?", difficulty: "Easy" },
    { question: "How do you set up a design system in Figma?", difficulty: "Medium" },
    { question: "Describe your handoff workflow between design and development.", difficulty: "Hard" },
  ],
  excel: [
    { question: "What are the most common Excel functions you use?", difficulty: "Easy" },
    { question: "How do you use pivot tables for data analysis?", difficulty: "Medium" },
    { question: "Describe a complex Excel automation you've built with macros or VBA.", difficulty: "Hard" },
  ],
  communication: [
    { question: "How do you communicate technical concepts to non-technical stakeholders?", difficulty: "Easy" },
    { question: "Describe a situation where miscommunication led to a problem. How did you fix it?", difficulty: "Medium" },
    { question: "How do you handle delivering bad news to a client or team?", difficulty: "Hard" },
  ],
  leadership: [
    { question: "What is your leadership style?", difficulty: "Easy" },
    { question: "How do you motivate underperforming team members?", difficulty: "Medium" },
    { question: "Describe how you led a team through a crisis or major change.", difficulty: "Hard" },
  ],
  teamwork: [
    { question: "How do you handle disagreements with teammates?", difficulty: "Easy" },
    { question: "Describe a project where collaboration was critical to success.", difficulty: "Medium" },
    { question: "How do you build trust in a cross-functional or remote team?", difficulty: "Hard" },
  ],
};

const HR_QUESTIONS: { question: string; difficulty: "Easy" | "Medium" | "Hard" }[] = [
  { question: "Tell me about yourself and your career journey.", difficulty: "Easy" },
  { question: "Why are you interested in this position?", difficulty: "Easy" },
  { question: "What are your greatest strengths?", difficulty: "Easy" },
  { question: "What is your biggest weakness and how are you working on it?", difficulty: "Medium" },
  { question: "What are your salary expectations?", difficulty: "Medium" },
  { question: "Where do you see yourself in 5 years?", difficulty: "Medium" },
  { question: "Why are you leaving your current role?", difficulty: "Medium" },
  { question: "What do you know about our company?", difficulty: "Easy" },
  { question: "How do you handle stress and pressure?", difficulty: "Medium" },
  { question: "What motivates you in your work?", difficulty: "Easy" },
];

const BEHAVIORAL_QUESTIONS: { question: string; difficulty: "Easy" | "Medium" | "Hard" }[] = [
  { question: "Tell me about a time you resolved a team conflict.", difficulty: "Medium" },
  { question: "Describe a project where you had to learn a new technology quickly.", difficulty: "Medium" },
  { question: "How do you prioritize tasks when you have multiple deadlines?", difficulty: "Easy" },
  { question: "Describe a situation where you failed and what you learned.", difficulty: "Hard" },
  { question: "Tell me about a time you led a project or initiative.", difficulty: "Hard" },
  { question: "Give an example of when you went above and beyond expectations.", difficulty: "Medium" },
  { question: "Describe a time you received critical feedback. How did you respond?", difficulty: "Medium" },
  { question: "Tell me about a complex problem you solved creatively.", difficulty: "Hard" },
  { question: "How have you handled a situation where you disagreed with your manager?", difficulty: "Hard" },
  { question: "Describe a time when you had to adapt to a significant change.", difficulty: "Medium" },
];

const SKILL_GAP_TEMPLATES = (skill: string): { question: string; difficulty: "Easy" | "Medium" | "Hard" }[] => [
  { question: `What do you know about ${skill} and how would you approach learning it?`, difficulty: "Easy" },
  { question: `How would you compensate for lack of ${skill} experience in this role?`, difficulty: "Medium" },
  { question: `Can you describe a situation where you quickly picked up a skill similar to ${skill}?`, difficulty: "Medium" },
];

const difficultyConfig = {
  Easy: { color: "text-success", bg: "bg-success/10" },
  Medium: { color: "text-warning", bg: "bg-warning/10" },
  Hard: { color: "text-destructive", bg: "bg-destructive/10" },
};

type Tab = "technical" | "hr" | "behavioral" | "skill-gap" | "project";

export default function InterviewPage() {
  const last = getLastAnalysis();
  const [activeTab, setActiveTab] = useState<Tab>("technical");
  const missing = last?.fullResult?.missingSkills || [];
  const matched = last?.fullResult?.matchedSkills || [];

  const technicalQuestions = useMemo(() => {
    const qs: { skill: string; items: { question: string; difficulty: "Easy" | "Medium" | "Hard" }[] }[] = [];
    for (const skill of matched) {
      const key = skill.toLowerCase();
      const items = SKILL_QUESTIONS[key];
      if (items) qs.push({ skill, items });
    }
    for (const skill of missing) {
      const key = skill.toLowerCase();
      const items = SKILL_QUESTIONS[key];
      if (items) qs.push({ skill, items });
    }
    return qs;
  }, [matched, missing]);

  const skillGapQuestions = useMemo(() => {
    return missing.flatMap((skill) => SKILL_GAP_TEMPLATES(skill).map((q) => ({ skill, ...q })));
  }, [missing]);

  // Project Deep-Dive: generate from matched skills as project anchors
  const projectQuestions = useMemo(() => {
    const anchors = matched.slice(0, 4);
    return anchors.flatMap((skill) => [
      { skill, question: `Walk me through a project where you used ${skill}. What was your specific role?`, difficulty: "Easy" as const },
      { skill, question: `What was the hardest technical decision you made on your ${skill} project, and what was the trade-off?`, difficulty: "Medium" as const },
      { skill, question: `If you rebuilt your ${skill} project today, what would you change architecturally and why?`, difficulty: "Hard" as const },
    ]);
  }, [matched]);

  if (!last) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="mb-8 animate-fade-in">
            <h1 className="font-heading text-2xl font-extrabold text-foreground">Interview Prep</h1>
            <p className="text-sm text-muted-foreground mt-1">Practice questions tailored to your skill gaps.</p>
          </div>
          <div className="dashboard-card flex flex-col items-center justify-center py-16 animate-fade-in">
            <Brain className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h2 className="font-heading font-bold text-foreground text-lg mb-2">No Analysis Data</h2>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Analyze your resume first to get personalized interview questions.
            </p>
            <Link to="/analyzer">
              <Button className="bg-primary text-primary-foreground font-semibold px-8 py-6 text-sm rounded-xl">
                Go to Analyzer <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Zap; count: number }[] = [
    { id: "technical", label: "Technical", icon: Zap, count: technicalQuestions.reduce((a, g) => a + g.items.length, 0) },
    { id: "project", label: "Project Deep-Dive", icon: BookOpen, count: projectQuestions.length },
    { id: "hr", label: "HR", icon: Users, count: HR_QUESTIONS.length },
    { id: "behavioral", label: "Behavioral", icon: Award, count: BEHAVIORAL_QUESTIONS.length },
    { id: "skill-gap", label: "Skill Gap", icon: Brain, count: skillGapQuestions.length },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Smart Interview Prep</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Questions based on your resume analysis — technical, HR, behavioral, and skill gaps.
          </p>
        </div>

        {/* Personalized prep plan */}
        {(() => {
          const plan = buildPrepPlan(last);
          if (plan.questions.length === 0) return null;
          const confColor: Record<string, string> = {
            High: "bg-success/10 text-success",
            Medium: "bg-warning/10 text-warning",
            Low: "bg-destructive/10 text-destructive",
          };
          return (
            <div className="dashboard-card mb-6 animate-fade-in border-primary/20">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  Likely Questions
                </h3>
                <span className="text-xs text-muted-foreground">
                  Recommended prep: <span className="font-semibold text-foreground">{plan.recommendedMinutes} min</span>
                </span>
              </div>
              <ol className="space-y-2 mb-4">
                {plan.questions.slice(0, 5).map((q, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
                    <span className="text-xs font-mono text-muted-foreground shrink-0 mt-0.5">{i + 1}.</span>
                    <span className="text-sm text-foreground flex-1">{q.question}</span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", confColor[q.confidence])}>
                      {q.confidence}
                    </span>
                  </li>
                ))}
              </ol>
              {plan.weakAreas.length > 0 && (
                <div className="pt-3 border-t border-border">
                  <p className="text-[10px] uppercase font-bold tracking-wide text-muted-foreground mb-2">Weak Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.weakAreas.map((w) => (
                      <span key={w} className="text-xs font-medium px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}


        <div className="flex gap-2 mb-6 flex-wrap animate-fade-in">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted border border-transparent"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className="text-[10px] bg-background px-1.5 py-0.5 rounded-full">{tab.count}</span>
            </button>
          ))}
        </div>

        {activeTab === "technical" && (
          <div className="space-y-5 animate-fade-in">
            {technicalQuestions.length === 0 ? (
              <div className="dashboard-card text-center py-8">
                <p className="text-sm text-muted-foreground">No skill-specific technical questions available for your matched/missing skills.</p>
              </div>
            ) : (
              technicalQuestions.map((group, i) => {
                const isMatched = matched.includes(group.skill);
                return (
                  <div key={group.skill} className="dashboard-card" style={{ animationDelay: `${i * 60}ms` }}>
                    <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <BookOpen className={cn("w-4 h-4", isMatched ? "text-success" : "text-destructive")} />
                      {group.skill}
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", isMatched ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                        {isMatched ? "Matched" : "Missing"}
                      </span>
                    </h3>
                    <ul className="space-y-2">
                      {group.items.map((q, j) => {
                        const d = difficultyConfig[q.difficulty];
                        return (
                          <li key={j} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                            <span className="text-xs text-muted-foreground font-mono mt-0.5 w-5 shrink-0">{j + 1}.</span>
                            <span className="text-sm text-foreground flex-1">{q.question}</span>
                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", d.bg, d.color)}>{q.difficulty}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "hr" && (
          <div className="dashboard-card animate-fade-in">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              HR Interview Questions
            </h3>
            <ul className="space-y-2">
              {HR_QUESTIONS.map((q, j) => {
                const d = difficultyConfig[q.difficulty];
                return (
                  <li key={j} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <span className="text-xs text-muted-foreground font-mono mt-0.5 w-5 shrink-0">{j + 1}.</span>
                    <span className="text-sm text-foreground flex-1">{q.question}</span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", d.bg, d.color)}>{q.difficulty}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {activeTab === "behavioral" && (
          <div className="dashboard-card animate-fade-in">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-warning" />
              Behavioral Questions
            </h3>
            <ul className="space-y-2">
              {BEHAVIORAL_QUESTIONS.map((q, j) => {
                const d = difficultyConfig[q.difficulty];
                return (
                  <li key={j} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                    <span className="text-xs text-muted-foreground font-mono mt-0.5 w-5 shrink-0">{j + 1}.</span>
                    <span className="text-sm text-foreground flex-1">{q.question}</span>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", d.bg, d.color)}>{q.difficulty}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {activeTab === "skill-gap" && (
          <div className="dashboard-card animate-fade-in">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-destructive" />
              Skill Gap Questions
              <span className="text-xs text-muted-foreground font-normal">Based on missing skills</span>
            </h3>
            {skillGapQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No missing skills detected — great job!</p>
            ) : (
              <ul className="space-y-2">
                {skillGapQuestions.map((q, j) => {
                  const d = difficultyConfig[q.difficulty];
                  return (
                    <li key={j} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <span className="text-xs text-muted-foreground font-mono mt-0.5 w-5 shrink-0">{j + 1}.</span>
                      <div className="flex-1">
                        <span className="text-sm text-foreground">{q.question}</span>
                        <span className="text-[10px] text-destructive ml-2">({q.skill})</span>
                      </div>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", d.bg, d.color)}>{q.difficulty}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {activeTab === "project" && (
          <div className="dashboard-card animate-fade-in">
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Project Deep-Dive Questions
              <span className="text-xs text-muted-foreground font-normal">Based on your matched skills</span>
            </h3>
            {projectQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No matched skills detected yet.</p>
            ) : (
              <ul className="space-y-2">
                {projectQuestions.map((q, j) => {
                  const d = difficultyConfig[q.difficulty];
                  return (
                    <li key={j} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <span className="text-xs text-muted-foreground font-mono mt-0.5 w-5 shrink-0">{j + 1}.</span>
                      <div className="flex-1">
                        <span className="text-sm text-foreground">{q.question}</span>
                        <span className="text-[10px] text-primary ml-2">({q.skill})</span>
                      </div>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0", d.bg, d.color)}>{q.difficulty}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
