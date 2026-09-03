import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
}

export function ProgressBar({ value, max = 100, label, showValue = true, className }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const getColor = () => {
    if (percentage >= 80) return "bg-success";
    if (percentage >= 60) return "bg-primary";
    if (percentage >= 40) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className={cn("space-y-2", className)}>
      {(label || showValue) && (
        <div className="flex justify-between text-sm">
          {label && <span className="text-muted-foreground font-medium">{label}</span>}
          {showValue && <span className="text-foreground font-semibold">{value}%</span>}
        </div>
      )}
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000 ease-out", getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
