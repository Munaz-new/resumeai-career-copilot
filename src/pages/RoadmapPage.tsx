import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, ArrowRight, Map, Target, FileCheck, Rocket } from "lucide-react";
import { getLastAnalysis } from "@/lib/analysisStore";

const SKILL_RESOURCES: Record<string, { title: string; url: string }[]> = {
  docker: [{ title: "Docker Docs", url: "https://docs.docker.com" }],
  aws: [{ title: "AWS Cloud Practitioner", url: "https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/" }],
  kubernetes: [{ title: "Kubernetes Basics", url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/" }],
  "ci/cd": [{ title: "GitHub Actions Docs", url: "https://docs.github.com/en/actions" }],
  graphql: [{ title: "GraphQL Tutorial", url: "https://graphql.org/learn/" }],
  python: [{ title: "Python Tutorial", url: "https://docs.python.org/3/tutorial/" }],
  typescript: [{ title: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/" }],
  react: [{ title: "React Docs", url: "https://react.dev" }],
  "node.js": [{ title: "Node.js Docs", url: "https://nodejs.org/en/docs/" }],
  sql: [{ title: "SQL Tutorial", url: "https://www.w3schools.com/sql/" }],
  mongodb: [{ title: "MongoDB University", url: "https://university.mongodb.com" }],
  git: [{ title: "Git Handbook", url: "https://guides.github.com/introduction/git-handbook/" }],
  "rest api": [{ title: "REST API Tutorial", url: "https://restfulapi.net/" }],
  "machine learning": [{ title: "ML Crash Course", url: "https://developers.google.com/machine-learning/crash-course" }],
};

const fallback = (skill: string) => [
  { title: `Learn ${skill}`, url: `https://www.google.com/search?q=learn+${encodeURIComponent(skill)}` },
];

export default function RoadmapPage() {
  const last = getLastAnalysis();
  const r = last?.fullResult;
  const missing = r?.missingSkills || [];
  const matched = r?.matchedSkills || [];
  const role = last?.jobDescriptionTitle && last.jobDescriptionTitle !== "Unknown Role"
    ? last.jobDescriptionTitle
    : "your target role";

  if (!last || !r) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="mb-8 animate-fade-in">
            <h1 className="font-heading text-2xl font-extrabold text-foreground">Career GPS</h1>
            <p className="text-sm text-muted-foreground mt-1">Your week-by-week mentor roadmap.</p>
          </div>
          <div className="dashboard-card flex flex-col items-center justify-center py-16 animate-fade-in">
            <Map className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h2 className="font-heading font-bold text-foreground text-lg mb-2">No Analysis Data</h2>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Analyze your resume first to get a personalized roadmap.
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

  const readiness = r.jobReadiness ?? r.atsScore;
  const top2 = missing.slice(0, 2);
  const stackForProject = (matched.length > 0 ? matched : missing).slice(0, 2).join(" + ") || "your core stack";

  type Week = { week: number; title: string; goal: string; icon: typeof Target; resources: { title: string; url: string }[] };
  const weeks: Week[] = [];

  if (top2[0]) {
    const key = top2[0].toLowerCase();
    weeks.push({
      week: 1,
      title: top2[0],
      goal: `Learn ${top2[0]} fundamentals. Build a small demo to internalize the concepts.`,
      icon: Target,
      resources: SKILL_RESOURCES[key] || fallback(top2[0]),
    });
  }
  if (top2[1]) {
    const key = top2[1].toLowerCase();
    weeks.push({
      week: 2,
      title: top2[1],
      goal: `Add ${top2[1]} on top of week 1 — combine both in a single working feature.`,
      icon: Target,
      resources: SKILL_RESOURCES[key] || fallback(top2[1]),
    });
  }
  weeks.push({
    week: weeks.length + 1,
    title: "Portfolio Project",
    goal: `Ship a portfolio project using ${stackForProject}. Push to GitHub with a clear README.`,
    icon: Rocket,
    resources: [{ title: "GitHub: New Repository", url: "https://github.com/new" }],
  });
  weeks.push({
    week: weeks.length + 1,
    title: "Resume + ATS Optimization",
    goal: "Update your resume with the new skills and project. Re-run the Analyzer to confirm score lift.",
    icon: FileCheck,
    resources: [{ title: "Open Analyzer", url: "/analyzer" }],
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="mb-6 animate-fade-in">
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Career GPS</h1>
          <p className="text-sm text-muted-foreground mt-1">
            4-week mentor roadmap to become ready for <span className="font-semibold text-foreground">{role}</span>.
          </p>
        </div>

        <div className="dashboard-card mb-6 flex items-center gap-5 animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Map className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Estimated readiness</p>
            <p className="font-heading font-extrabold text-foreground text-2xl">{readiness}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complete the 4 weeks below to push this toward 90%+.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {weeks.map((w, i) => (
            <div key={i} className="dashboard-card animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <w.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-primary mb-0.5">Week {w.week}</p>
                  <h3 className="font-heading font-bold text-foreground">{w.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{w.goal}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {w.resources.map((r) => (
                      <a
                        key={r.title}
                        href={r.url}
                        target={r.url.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10"
                      >
                        <BookOpen className="w-3 h-3" />
                        {r.title}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
