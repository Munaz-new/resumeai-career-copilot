import { cn } from "@/lib/utils";

interface SkillBadgeProps {
  skill: string;
  matched?: boolean;
  className?: string;
}

export function SkillBadge({ skill, matched = false, className }: SkillBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
        matched
          ? "bg-success/8 border-success/20 text-success"
          : "bg-destructive/8 border-destructive/20 text-destructive",
        className
      )}
    >
      {skill}
    </span>
  );
}
