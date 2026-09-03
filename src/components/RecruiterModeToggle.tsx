import { Eye, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReviewMode = "friendly" | "recruiter";

export function RecruiterModeToggle({
  mode,
  onChange,
}: {
  mode: ReviewMode;
  onChange: (m: ReviewMode) => void;
}) {
  return (
    <div className="inline-flex items-center bg-muted rounded-xl p-1 text-xs font-medium">
      <button
        onClick={() => onChange("friendly")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
          mode === "friendly" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
        )}
      >
        <Heart className="w-3.5 h-3.5" />
        Friendly Review
      </button>
      <button
        onClick={() => onChange("recruiter")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all",
          mode === "recruiter" ? "bg-background shadow-sm text-destructive" : "text-muted-foreground"
        )}
      >
        <Eye className="w-3.5 h-3.5" />
        Recruiter Mode
      </button>
    </div>
  );
}

const RECRUITER_REPHRASES: { match: RegExp; replace: string }[] = [
  { match: /add measurable achievements/i, replace: "Your bullets lack measurable outcomes — recruiters skip past vague claims" },
  { match: /add a professional summary/i, replace: "No summary at the top — recruiters can't tell what you do in 6 seconds" },
  { match: /improve action verbs/i, replace: "Weak verbs make you sound passive — fix this before sending the resume out" },
  { match: /add projects section/i, replace: "Resume feels light on real work — projects are non-negotiable for early-career profiles" },
  { match: /add certifications/i, replace: "No credentials listed — for competitive roles this hurts you against equally-skilled peers" },
  { match: /fix section headers/i, replace: "Sloppy or missing section headers — your resume may not parse at all in ATS" },
  { match: /add bullet points/i, replace: "Wall of text. Recruiters won't read it. Convert to bullets immediately" },
  { match: /expand resume content/i, replace: "Resume is too thin — looks like minimal effort was put in" },
];

export function applyRecruiterTone(text: string, mode: ReviewMode): string {
  if (mode !== "recruiter") return text;
  for (const { match, replace } of RECRUITER_REPHRASES) {
    if (match.test(text)) return replace;
  }
  return text;
}