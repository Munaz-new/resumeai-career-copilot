import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Info, ArrowRight } from "lucide-react";

export function GuestBanner() {
  const { isGuest } = useAuth();
  if (!isGuest) return null;

  return (
    <div className="mx-8 mt-4 mb-0 p-3 rounded-xl bg-primary/5 border border-primary/10 flex items-center gap-3 animate-fade-in">
      <Info className="w-4 h-4 text-primary shrink-0" />
      <p className="text-xs text-muted-foreground flex-1">
        Continue as <span className="font-semibold text-foreground">Guest</span> for quick analysis.{" "}
        <Link to="/auth" className="text-primary font-medium hover:underline inline-flex items-center gap-0.5">
          Sign in to save progress <ArrowRight className="w-3 h-3" />
        </Link>
      </p>
    </div>
  );
}
