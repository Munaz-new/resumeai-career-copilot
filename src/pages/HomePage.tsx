import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ScoreRing } from "@/components/ScoreRing";
import { StatCard } from "@/components/StatCard";
import { ProgressBar } from "@/components/ProgressBar";
import { SkillBadge } from "@/components/SkillBadge";
import { JobReadyMeter } from "@/components/JobReadyMeter";
import {
  Target, CheckCircle2, FileText, Eye, Lightbulb,
  ArrowRight, TrendingUp, Zap, BookOpen, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLastAnalysis } from "@/lib/analysisStore";
import { QuickActions } from "@/components/QuickActions";
import { NextBestStepCard } from "@/components/NextBestStepCard";
import { LatestAnalysisCard } from "@/components/LatestAnalysisCard";
import { QuickWinsPanel } from "@/components/QuickWinsPanel";

export default function HomePage() {
  const last = getLastAnalysis();
  const r = last?.fullResult;

  // No analysis yet — show empty state
  if (!r) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-8 space-y-6">
          <div className="animate-fade-in">
            <h1 className="font-heading text-2xl font-extrabold text-foreground">AI Career Copilot</h1>
            <p className="text-muted-foreground text-sm mt-1">
              For students &amp; freshers — go beyond ATS scoring with personalized coaching.
            </p>
          </div>

          <div className="dashboard-card flex flex-col items-center justify-center py-12 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <h2 className="font-heading font-bold text-foreground text-lg mt-4 mb-2 text-center">
              Become job-ready, not just score-ready
            </h2>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
              Upload your resume + a job description. Get an ATS score, JD heatmap, AI rewrites, and a week-by-week Career GPS roadmap.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/builder">
                <Button className="bg-primary text-primary-foreground font-semibold px-6 py-5 text-sm rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  Build a Resume
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/analyzer">
                <Button variant="outline" className="font-semibold px-6 py-5 text-sm rounded-xl">
                  Analyze existing resume
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="animate-fade-in">
            <h2 className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground mb-3">
              Quick Actions
            </h2>
            <QuickActions />
          </div>

          <NextBestStepCard />
        </div>
      </Layout>
    );
  }

  // Determine recruiter impression from formatting + readability
  const impressionScore = Math.round((r.formattingScore + r.readabilityScore) / 2);
  const impressionLabel = impressionScore >= 75 ? "Excellent" : impressionScore >= 50 ? "Good" : impressionScore >= 30 ? "Needs Work" : "Poor";
  const impressionSub = impressionScore >= 75 ? "Clean and well-structured" : impressionScore >= 50 ? "Formatting is decent" : "Improve formatting & readability";

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Latest analysis: <span className="font-medium text-foreground">{last.fileName}</span>
            <span className="ml-2 text-xs">({new Date(last.date).toLocaleDateString()})</span>
          </p>
        </div>

        {/* Latest analysis snapshot */}
        <div className="mb-6">
          <LatestAnalysisCard />
        </div>

        {/* Quick Actions */}
        <div className="mb-6 animate-fade-in">
          <h2 className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground mb-3">
            Quick Actions
          </h2>
          <QuickActions />
        </div>

        <div className="grid lg:grid-cols-2 gap-5 mb-6">
          <NextBestStepCard />
          <QuickWinsPanel result={r} />
        </div>





        {/* Hero Analytics Row */}
        <div className="grid lg:grid-cols-4 gap-5 mb-6 animate-fade-in">
          <div className="dashboard-card flex flex-col items-center justify-center">
            <ScoreRing score={r.atsScore} label="ATS Score" size={130} strokeWidth={10} />
            <p className="text-xs text-muted-foreground mt-3 font-medium">Overall Score</p>
          </div>
          <StatCard icon={TrendingUp} label="Resume Strength" value={`${r.skillsMatch}%`}
            subtitle={r.skillsMatch >= 70 ? "Above average" : "Needs improvement"}
            iconBg="bg-success/10" iconColor="text-success" />
          <StatCard icon={Target} label="Job Match" value={`${r.keywordMatch}%`}
            subtitle={r.keywordMatch >= 70 ? "Strong match" : "Needs improvement"}
            iconBg="bg-warning/10" iconColor="text-warning" />
          <StatCard icon={Eye} label="Recruiter Impression" value={impressionLabel}
            subtitle={impressionSub}
            iconBg="bg-info/10" iconColor="text-info" />
        </div>

        {/* Bento Cards */}
        <div className="grid lg:grid-cols-3 gap-5 mb-6">
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
              <Target className="w-4 h-4 text-destructive" />
              Missing Skills ({r.missingSkills.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {r.missingSkills.length > 0
                ? r.missingSkills.map((s) => <SkillBadge key={s} skill={s} />)
                : <p className="text-sm text-muted-foreground">All required skills present!</p>}
            </div>
          </div>

          <div className="dashboard-card animate-fade-in" style={{ animationDelay: "150ms" }}>
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Detailed Scores
            </h3>
            <div className="space-y-4">
              <ProgressBar label="Keyword Match" value={r.keywordMatch} />
              <ProgressBar label="Formatting" value={r.formattingScore} />
              <ProgressBar label="Readability" value={r.readabilityScore} />
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="dashboard-card animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-warning" />
              Smart Suggestions
            </h3>
            <ul className="space-y-3">
              {r.suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                  <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <JobReadyMeter score={r.atsScore} className="animate-fade-in" />
        </div>

        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: "300ms" }}>
          <Link to="/analyzer">
            <Button className="bg-primary text-primary-foreground font-semibold px-8 py-6 text-sm rounded-xl shadow-sm hover:shadow-md transition-shadow">
              Upload & Analyze Resume
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
