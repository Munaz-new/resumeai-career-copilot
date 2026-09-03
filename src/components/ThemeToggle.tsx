import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-9 w-[72px] items-center rounded-full p-1 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDark ? "bg-accent" : "bg-muted"
      )}
      aria-label="Toggle theme"
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full bg-card shadow-sm transition-all duration-300",
          isDark ? "translate-x-[36px]" : "translate-x-0"
        )}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Sun className="h-3.5 w-3.5 text-warning" />
        )}
      </span>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
