import { AlertCircle, Info, Wrench, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  problem: string;
  why: string;
  fix: string;
  gain: string;
  className?: string;
}

/**
 * Reusable Problem → Why → Fast Fix → Expected Gain block.
 * Used by QuickWins, Suggestions, MissingSkills detail.
 */
export function InsightBlock({ problem, why, fix, gain, className }: Props) {
  return (
    <div className={cn("space-y-3 text-sm", className)}>
      <Row icon={AlertCircle} label="Problem" tone="destructive" text={problem} />
      <Row icon={Info} label="Why it matters" tone="info" text={why} />
      <Row icon={Wrench} label="Fast fix" tone="primary" text={fix} />
      <Row icon={TrendingUp} label="Expected gain" tone="success" text={gain} />
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  tone,
  text,
}: {
  icon: typeof AlertCircle;
  label: string;
  tone: "destructive" | "info" | "primary" | "success";
  text: string;
}) {
  const toneMap = {
    destructive: "text-destructive bg-destructive/10",
    info: "text-info bg-info/10",
    primary: "text-primary bg-primary/10",
    success: "text-success bg-success/10",
  } as const;
  return (
    <div className="flex items-start gap-3">
      <span className={cn("shrink-0 w-7 h-7 rounded-lg flex items-center justify-center", toneMap[tone])}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-0.5">{label}</p>
        <p className="text-sm text-foreground leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
