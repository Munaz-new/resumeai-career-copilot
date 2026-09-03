import { Check, X } from "lucide-react";
import type { AnalysisResult } from "@/lib/analysisStore";

interface Props {
  result: AnalysisResult;
}

export function JobMatchExplain({ result }: Props) {
  const matched = result.matchedSkills.slice(0, 3);
  const missing = result.missingSkills.slice(0, 2);
  if (matched.length === 0 && missing.length === 0) return null;

  return (
    <div className="mt-4 text-left w-full">
      <p className="text-[10px] uppercase font-bold tracking-wide text-muted-foreground mb-2">Why?</p>
      <ul className="space-y-1">
        {matched.map((s) => (
          <li key={`m-${s}`} className="flex items-center gap-2 text-xs text-foreground">
            <Check className="w-3 h-3 text-success" />
            <span>{s} matched</span>
          </li>
        ))}
        {missing.map((s) => (
          <li key={`x-${s}`} className="flex items-center gap-2 text-xs text-muted-foreground">
            <X className="w-3 h-3 text-destructive" />
            <span>Missing: {s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
