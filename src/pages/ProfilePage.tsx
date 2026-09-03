import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { AuthGate } from "@/components/AuthGate";
import { useAuth } from "@/contexts/AuthContext";
import { User, Clock, FileText, Trash2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getGuestHistory, clearGuestHistory, getAuthHistory, clearAuthHistory,
  type AnalysisHistoryEntry,
} from "@/lib/analysisStore";
import { SkillBadge } from "@/components/SkillBadge";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, isGuest, signOut } = useAuth();
  const [history, setHistory] = useState<AnalysisHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setHistory(getGuestHistory());
      setLoading(false);
    } else if (user) {
      getAuthHistory(user.id).then((h) => { setHistory(h); setLoading(false); });
    }
  }, [user, isGuest]);

  const handleClear = async () => {
    if (user) {
      await clearAuthHistory(user.id);
    } else {
      clearGuestHistory();
    }
    setHistory([]);
    toast.success("History cleared");
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-2xl font-extrabold text-foreground">History</h1>
          <p className="text-sm text-muted-foreground mt-1">Your analysis history and account.</p>
        </div>

        <div className="dashboard-card mb-8 flex items-center gap-5 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading font-bold text-foreground text-lg">
              {isGuest ? "Guest User" : user?.email}
            </h2>
            <p className="text-sm text-muted-foreground">
              {history.length} analysis {history.length === 1 ? "entry" : "entries"}
              {isGuest ? " saved locally (max 3)" : " saved to your account"}
            </p>
          </div>
          <div className="flex gap-2">
            {history.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleClear} className="text-destructive hover:text-destructive border-destructive/30">
                <Trash2 className="w-4 h-4 mr-1" /> Clear All
              </Button>
            )}
            {!isGuest && (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-1" /> Sign Out
              </Button>
            )}
          </div>
        </div>

        {/* If guest, show auth gate for full history */}
        {isGuest && (
          <div className="mb-6">
            <AuthGate message="Sign in to save unlimited analysis history across devices.">
              <div />
            </AuthGate>
          </div>
        )}

        <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          {isGuest ? "Recent Analyses (Guest)" : "Analysis History"}
        </h3>

        {loading ? (
          <div className="dashboard-card text-center py-12 animate-fade-in">
            <p className="text-muted-foreground text-sm">Loading history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="dashboard-card text-center py-12 animate-fade-in">
            <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No analyses yet. Go to the Analyzer to create your first one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={h.id} className="dashboard-card-hover animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground font-semibold">{h.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.date).toLocaleDateString()} · {new Date(h.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-heading font-extrabold text-foreground">{h.score}</span>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{h.summary}</p>
                <p className="text-xs text-muted-foreground mb-2">Target: {h.jobDescriptionTitle}</p>
                {(h.matchedSkills.length > 0 || h.missingSkills.length > 0) && (
                  <div className="flex flex-wrap gap-1.5">
                    {h.matchedSkills.slice(0, 5).map((s) => <SkillBadge key={s} skill={s} matched />)}
                    {h.missingSkills.slice(0, 3).map((s) => <SkillBadge key={s} skill={s} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
