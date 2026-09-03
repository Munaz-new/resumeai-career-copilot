import { Link } from "react-router-dom";
import { ScoreRing } from "@/components/ScoreRing";
import { FileText, ArrowRight } from "lucide-react";
import { getLastAnalysis } from "@/lib/analysisStore";

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffH < 1) return "Just now";
  if (diffH < 24) return `${diffH}h ago`;
  const days = Math.floor(diffH / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function LatestAnalysisCard() {
  const last = getLastAnalysis();
  if (!last) return null;
  const r = last.fullResult;
  const recruiterTier =
    r.recruiterScanScore != null
      ? r.recruiterScanScore >= 75
        ? "Excellent"
        : r.recruiterScanScore >= 55
        ? "Good"
        : "Needs Work"
      : null;

  return (
    <div className="dashboard-card animate-fade-in flex items-center gap-5">
      <ScoreRing score={r.atsScore} label="ATS" size={88} strokeWidth={8} />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wide font-bold text-muted-foreground">Latest Resume</p>
        <h3 className="font-heading font-bold text-foreground truncate flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary shrink-0" />
          {last.fileName}
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
          <span>
            ATS Score: <span className="font-semibold text-foreground">{r.atsScore}</span>
          </span>
          {recruiterTier && (
            <span>
              Recruiter: <span className="font-semibold text-foreground">{recruiterTier}</span>
            </span>
          )}
          <span>Analyzed {relativeDate(last.date)}</span>
        </div>
      </div>
      <Link
        to="/analyzer"
        className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
      >
        Open <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
