import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Upload, Puzzle, Lightbulb,
  MessageSquareText, Clock, ChevronLeft, ChevronRight, Sparkles,
  LogOut, GitCompare, FilePlus, X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Resume Builder", url: "/builder", icon: FilePlus },
  { title: "Resume Analyzer", url: "/analyzer", icon: Upload },
  { title: "Skills Match", url: "/skills", icon: Puzzle },
  { title: "Suggestions", url: "/suggestions", icon: Lightbulb },
  { title: "Interview Prep", url: "/interview", icon: MessageSquareText },
  { title: "Job Compare", url: "/compare", icon: GitCompare },
  { title: "Career GPS", url: "/roadmap", icon: Sparkles },
  { title: "History", url: "/profile", icon: Clock },
];

interface AppSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppSidebar({ mobileOpen = false, onMobileClose }: AppSidebarProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, isGuest, signOut } = useAuth();

  const initial = user?.email?.[0]?.toUpperCase() ?? "U";

  const handleNav = () => onMobileClose?.();

  return (
    <aside
      className={cn(
        "flex flex-col shrink-0 border-r border-sidebar-border transition-transform duration-300",
        "fixed inset-y-0 left-0 z-50 w-[260px] md:relative md:z-auto md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        collapsed ? "md:w-[68px]" : "md:w-[260px]"
      )}
      style={{ background: "hsl(var(--sidebar-background))" }}
    >
      {/* Logo */}
      <div
        className="flex items-center justify-between gap-3 px-4 h-14 border-b"
        style={{ borderColor: "hsl(var(--sidebar-border))" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/branding/resumeai-icon.png"
            alt="ResumeAI"
            className="w-8 h-8 shrink-0 object-contain"
          />
          {(!collapsed || mobileOpen) && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-heading font-bold text-[16px] tracking-tight text-foreground">
                ResumeAI
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">
                Career Copilot
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          aria-label="Close navigation menu"
          className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          onClick={onMobileClose}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <Link
              key={item.url}
              to={item.url}
              onClick={handleNav}
              className={cn("nav-item", isActive && "nav-item-active")}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Auth status */}
      <div className="px-3 py-3" style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}>
        {isGuest ? (
          collapsed && !mobileOpen ? (
            <Link to="/auth" onClick={handleNav} className="nav-item w-full justify-center" title="Save Progress">
              <Sparkles className="w-[18px] h-[18px] shrink-0" />
            </Link>
          ) : (
            <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-semibold text-foreground">Guest Mode</span>
              </div>
              <p className="text-[11px] text-muted-foreground mb-2.5 leading-snug">
                Using app without account
              </p>
              <Link
                to="/auth"
                onClick={handleNav}
                className="block text-center text-xs font-semibold bg-primary text-primary-foreground rounded-lg px-3 py-2 hover:opacity-90 transition-opacity"
              >
                Save Progress
              </Link>
            </div>
          )
        ) : collapsed && !mobileOpen ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              {initial}
            </div>
            <button onClick={() => signOut()} className="nav-item w-full justify-center" title="Sign Out">
              <LogOut className="w-[18px] h-[18px] shrink-0" />
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-3">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] text-muted-foreground">Signed in</div>
                <div className="text-xs font-medium text-foreground truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="w-full text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <div className="px-3 py-3" style={{ borderTop: "1px solid hsl(var(--sidebar-border))" }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="nav-item w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
