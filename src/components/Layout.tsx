import { AppSidebar } from "./AppSidebar";
import { ThemeToggle } from "./ThemeToggle";
import { GuestBanner } from "./GuestBanner";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-auto bg-background transition-colors duration-300">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-end h-14 px-8 border-b border-border bg-background/80 backdrop-blur-sm transition-colors duration-300">
          <ThemeToggle />
        </header>
        <GuestBanner />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
