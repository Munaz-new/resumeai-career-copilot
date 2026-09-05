import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "./ThemeToggle";
import { GuestBanner } from "./GuestBanner";

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen flex w-full overflow-x-hidden">
      <AppSidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <div className="min-w-0 flex-1 flex flex-col overflow-auto bg-background transition-colors duration-300">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between h-14 px-4 sm:px-8 border-b border-border bg-background/80 backdrop-blur-sm transition-colors duration-300">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
          <ThemeToggle />
        </header>
        <GuestBanner />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
