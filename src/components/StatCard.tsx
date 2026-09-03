import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  iconBg?: string;
  iconColor?: string;
  className?: string;
}

export function StatCard({ icon: Icon, label, value, subtitle, iconBg, iconColor, className }: StatCardProps) {
  return (
    <div className={cn("dashboard-card", className)}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBg || "bg-primary/10")}>
          <Icon className={cn("w-5 h-5", iconColor || "text-primary")} />
        </div>
      </div>
      <p className="stat-value">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}
