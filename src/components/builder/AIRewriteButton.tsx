import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!text.trim()) {
      toast.error("Write something first");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("rewrite-resume", {
        body: { bullets: [text], jobDescription: jobDescription || "", mode, targetRole },
      });
      if (error) throw error;
      const improved = data?.rewrites?.[0]?.improved;
      if (improved) {
        onResult(improved);
        toast.success("Rewritten");
      } else {
        toast.error("No rewrite returned");
      }
    } catch (e) {
      toast.error("AI rewrite failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={loading}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:bg-primary/10 px-2 py-1 rounded-md transition-colors disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Sparkles className="w-3 h-3" />
      )}
      AI rewrite
    </button>
  );
}
