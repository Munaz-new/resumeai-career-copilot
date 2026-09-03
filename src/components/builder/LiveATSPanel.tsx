import { useEffect, useMemo, useState } from "react";
import { analyzeResume } from "@/lib/analysisStore";
import { draftToPlainText, type ResumeDraft } from "@/lib/resumeDraft";
import { ScoreRing } from "@/components/ScoreRing";
import { Lightbulb, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

function contextualize(s: string, matchedSkills: string[], missingSkills: string[]): string {
  const lower = s.toLowerCase();
  if (lower.includes("summary")) {
    return "Your professional summary is empty or weak — recruiters scan this section first.";
  }
  if (lower.includes("project")) {
    return "Projects section is weak. Add measurable outcomes (e.g. ‘reduced load time by 40%’).";
  }
  if (lower.includes("action verb")) {
    return "Lead bullets with stronger action verbs (Built, Shipped, Led, Automated).";
  }
  const skillMatch = s.match(/skill[^:]*:\s*([A-Za-z0-9+#./\- ]+)/i);
  if (skillMatch && missingSkills.length) {
    const missing = missingSkills[0];
    const have = matchedSkills[0];
    if (have) return `You added ${have} — adding ${missing} may further improve your ATS score.`;
    return `Adding ${missing} to your skills could meaningfully boost your ATS score.`;
  }
  return s;
}


export function LiveATSPanel({ draft }: { draft: ResumeDraft }) {
  const text = useMemo(() => draftToPlainText(draft), [draft]);
  const [result, setResult] = useState<ReturnType<typeof analyzeResume>["result"] | null>(null);

  useEffect(() => {
    if (!text || text.trim().length < 80) {
      setResult(null);
      return;
    }
    const t = setTimeout(() => {
      try {
        const { result } = analyzeResume(text, draft.jobDescription || "", false);
        setResult(result);
      } catch {
        setResult(null);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [text, draft.jobDescription]);

  return (
    <aside className="dashboard-card sticky top-4 animate-fade-in">
      <h3 className="font-heading font-bold text-foreground text-sm mb-3">Live ATS Score</h3>

      {!result ? (
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground">
            Fill in a few sections to see your live ATS score update in real time.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center mb-4">
            <ScoreRing score={result.atsScore} label="ATS" size={110} strokeWidth={9} />
            {typeof result.recruiterScanScore === "number" && (
              <p className="text-[11px] text-muted-foreground mt-2">
                Recruiter scan: <span className="font-semibold text-foreground">{result.recruiterScanScore}%</span>
              </p>
            )}
          </div>

          {draft.jobDescription && (
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
              <div className="rounded-lg bg-success/10 border border-success/20 p-2">
                <div className="flex items-center gap-1 text-success font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Matched
                </div>
                <p className="text-foreground font-bold mt-0.5">{result.matchedSkills.length}</p>
              </div>
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2">
                <div className="flex items-center gap-1 text-destructive font-semibold">
                  <XCircle className="w-3 h-3" /> Missing
                </div>
                <p className="text-foreground font-bold mt-0.5">{result.missingSkills.length}</p>
              </div>
            </div>
          )}

          {result.missingSkills.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
                Top missing skills
              </p>
              <div className="flex flex-wrap gap-1">
                {result.missingSkills.slice(0, 6).map((s) => (
                  <span
                    key={s}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">
                Suggestions
              </p>
              <ul className="space-y-1.5">
                {result.suggestions.slice(0, 5).map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-foreground">
                    <Lightbulb className="w-3 h-3 text-warning mt-0.5 shrink-0" />
                    <span className="leading-snug">
                      {contextualize(s, result.matchedSkills, result.missingSkills)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Link
            to="/analyzer"
            className="flex items-center justify-center gap-1 text-xs text-primary font-semibold hover:underline"
          >
            Open full analysis <ExternalLink className="w-3 h-3" />
          </Link>
        </>
      )}
    </aside>
  );
}
