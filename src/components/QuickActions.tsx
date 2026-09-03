import { Link } from "react-router-dom";
import { Upload, FileEdit, Compass, GitCompare, ArrowUpRight, type LucideIcon } from "lucide-react";

interface Action {
  to: string;
  label: string;
  desc: string;
  Icon: LucideIcon;
}

const ACTIONS: Action[] = [
  { to: "/analyzer", label: "Upload Resume", desc: "Start ATS analysis", Icon: Upload },
  { to: "/builder", label: "Resume Builder", desc: "Create ATS-friendly resume", Icon: FileEdit },
  { to: "/roadmap", label: "Career GPS", desc: "Find your best-fit role", Icon: Compass },
  { to: "/compare", label: "Job Compare", desc: "Compare multiple jobs", Icon: GitCompare },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {ACTIONS.map(({ to, label, desc, Icon }) => (
        <Link
          key={to}
          to={to}
          className="dashboard-card hover-lift group flex flex-col gap-3 p-5"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="font-heading font-bold text-foreground text-sm">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
