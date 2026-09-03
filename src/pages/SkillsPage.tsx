import { Layout } from "@/components/Layout";
import { Link } from "react-router-dom";
import { SkillBadge } from "@/components/SkillBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { Puzzle, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { getLastAnalysis } from "@/lib/analysisStore";

export default function SkillsPage() {
  const last = getLastAnalysis();
  const r = last?.fullResult;

  if (!r) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-8 py-8">
          <div className="mb-8 animate-fade-in">
            <h1 className="font-heading text-2xl font-extrabold text-foreground">Skills Match</h1>
            <p className="text-sm text-muted-foreground mt-1">Compare your skills against the job requirements.</p>
          </div>
          <div className="dashboard-card flex flex-col items-center justify-center py-16 animate-fade-in">
            <Puzzle className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h2 className="font-heading font-bold text-foreground text-lg mb-2">No Analysis Data</h2>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Analyze your resume first to see your skills match breakdown.
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

  const total = r.matchedSkills.length + r.missingSkills.length;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Skills Match</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {r.matchedSkills.length} of {total} required skills matched ({r.skillsMatch}%)
          </p>
        </div>

        <div className="dashboard-card mb-6 animate-fade-in">
          <ProgressBar label="Overall Skills Match" value={r.skillsMatch} />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="dashboard-card animate-fade-in" style={{ animationDelay: "50ms" }}>
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              Matched Skills ({r.matchedSkills.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {r.matchedSkills.length > 0
                ? r.matchedSkills.map((s) => <SkillBadge key={s} skill={s} matched />)
                : <p className="text-sm text-muted-foreground">No skills matched</p>}
            </div>
          </div>

          <div className="dashboard-card animate-fade-in" style={{ animationDelay: "100ms" }}>
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-destructive" />
              Missing Skills ({r.missingSkills.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {r.missingSkills.length > 0
                ? r.missingSkills.map((s) => <SkillBadge key={s} skill={s} />)
                : <p className="text-sm text-muted-foreground">All required skills present!</p>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
