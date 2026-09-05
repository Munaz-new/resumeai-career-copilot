import { useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "./ThemeToggle";
import { GuestBanner } from "./GuestBanner";

export function Layout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full min-w-0 overflow-x-hidden">
      <AppSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden bg-background transition-colors duration-300">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between md:justify-end h-14 px-4 sm:px-6 md:px-8 border-b border-border bg-background/80 backdrop-blur-sm transition-colors duration-300">
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <ThemeToggle />
        </header>
        <GuestBanner />
        <main className="flex-1 min-w-0 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
