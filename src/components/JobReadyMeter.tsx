import { cn } from "@/lib/utils";

interface JobReadyMeterProps {
  score: number;
  className?: string;
  strengths?: string[];
  weaknesses?: string[];
}

const levels = [
  { min: 0, max: 40, label: "Internship Ready", color: "bg-warning" },
  { min: 40, max: 70, label: "Job Ready", color: "bg-primary" },
  { min: 70, max: 100, label: "Industry Ready", color: "bg-success" },
];

export function JobReadyMeter({ score, className, strengths, weaknesses }: JobReadyMeterProps) {
  const currentLevel = levels.find((l) => score >= l.min && score <= l.max) || levels[0];

  return (
    <div className={cn("dashboard-card", className)}>
      <h3 className="font-heading font-bold text-foreground mb-1">Job Readiness Meter</h3>
      <p className="text-xs text-muted-foreground mb-5">Estimated competitiveness for this role</p>

      <div className="relative h-3 rounded-full bg-muted overflow-hidden mb-4">
        <div
          className={cn("h-full rounded-full transition-all duration-1000", currentLevel.color)}
          style={{ width: `${score}%` }}
        />
        <div className="absolute top-0 left-[40%] w-px h-full bg-border" />
        <div className="absolute top-0 left-[70%] w-px h-full bg-border" />
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        {levels.map((l) => (
          <span key={l.label} className={cn(currentLevel.label === l.label && "text-foreground font-semibold")}>
            {l.label}
          </span>
        ))}
      </div>

      <div className="mt-5 text-center">
        <span className="stat-value">{score}</span>
        <span className="text-muted-foreground text-sm ml-1">/100</span>
        <p className="text-sm text-primary font-semibold mt-1">{currentLevel.label}</p>
      </div>

      {(strengths?.length || weaknesses?.length) && (
        <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-border">
          <div>
            <p className="text-[10px] font-bold uppercase text-success mb-2">Strengths</p>
            {strengths && strengths.length > 0 ? (
              <ul className="space-y-1">
                {strengths.map((s) => (
                  <li key={s} className="text-xs text-foreground flex items-start gap-1.5">
                    <span className="text-success mt-0.5">✓</span>{s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">Build more wins first.</p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-warning mb-2">Weaknesses</p>
            {weaknesses && weaknesses.length > 0 ? (
              <ul className="space-y-1">
                {weaknesses.map((w) => (
                  <li key={w} className="text-xs text-foreground flex items-start gap-1.5">
                    <span className="text-warning mt-0.5">⚠</span>{w}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground italic">No major gaps.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
