import { useEffect, useRef, useState } from "react";
import { Sparkles, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RewritePhase = "idle" | "analyzing" | "rewriting" | "done";

export function AIRewriteButton({
  text,
  jobDescription,
  targetRole,
  mode = "bullet",
  onResult,
}: {
  text: string;
  jobDescription?: string;
  targetRole?: string;
  mode?: "bullet" | "section";
  onResult: (improved: string) => void;
}) {
  const [phase, setPhase] = useState<RewritePhase>("idle");
  const phaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loading = phase === "analyzing" || phase === "rewriting";

  useEffect(() => {
    return () => {
      if (phaseTimer.current) clearTimeout(phaseTimer.current);
      if (doneTimer.current) clearTimeout(doneTimer.current);
    };
  }, []);

  const run = async () => {
    if (!text.trim()) {
      toast.error("Write something first");
      return;
    }

    if (phaseTimer.current) clearTimeout(phaseTimer.current);
    if (doneTimer.current) clearTimeout(doneTimer.current);

    setPhase("analyzing");

    // Give the user a clear two-stage progress signal while the AI request runs.
    phaseTimer.current = setTimeout(() => {
      setPhase("rewriting");
    }, 700);

    try {
      const { data, error } = await supabase.functions.invoke("rewrite-resume", {
        body: { bullets: [text], jobDescription: jobDescription || "", mode, targetRole },
      });

      if (error) {
        const message = error.message || "";
        if (/temporarily busy|rate limit|try again/i.test(message)) {
          throw new Error("AI service is temporarily busy. Please try again in a moment.");
        }
        throw error;
      }

      const backendError = data?.error;
      if (backendError) {
        throw new Error(backendError);
      }

      const improved = data?.rewrites?.[0]?.improved;
      if (improved) {
        onResult(improved);
        setPhase("done");
        toast.success("Rewritten");

        doneTimer.current = setTimeout(() => {
          setPhase("idle");
        }, 1200);
      } else {
        setPhase("idle");
        toast.error("No rewrite returned");
      }
    } catch (e) {
      setPhase("idle");
      const message = e instanceof Error ? e.message : "";
      toast.error(message || "AI rewrite failed");
    }
  };

  const label =
    phase === "analyzing"
      ? "Analyzing…"
      : phase === "rewriting"
        ? "Rewriting…"
        : phase === "done"
          ? "Done"
          : "AI rewrite";

  return (
    <button
      type="button"
      onClick={run}
      disabled={loading}
      aria-live="polite"
      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:bg-primary/10 px-2 py-1 rounded-md transition-colors disabled:opacity-70"
    >
      {phase === "done" ? (
        <Check className="w-3 h-3" />
      ) : loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Sparkles className="w-3 h-3" />
      )}
      {label}
    </button>
  );
}
