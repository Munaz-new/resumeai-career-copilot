import { useState } from "react";
import { Sparkles, Copy, Check, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RewriteResult {
  original: string;
  improved: string;
}

export function ResumeRewriter({
  resumeText,
  jobDescription,
}: {
  resumeText: string;
  jobDescription: string;
}) {
  const [rewrites, setRewrites] = useState<RewriteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [mode, setMode] = useState<"bullet" | "section" | "full">("bullet");

  const extractBullets = (text: string): string[] => {
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 15 && l.length < 200);
    const bullets = lines.filter(
      (l) => /^[-•*]/.test(l) || /^(worked|helped|did|made|was responsible|managed|assisted|handled|created|developed)/i.test(l)
    );
    if (bullets.length >= 3) return bullets.slice(0, 8);
    // fallback: use experience-looking lines
    return lines.filter((l) => l.length > 20).slice(0, 8);
  };

  const handleRewrite = async () => {
    let inputs: string[] = [];
    if (mode === "bullet") {
      inputs = extractBullets(resumeText);
    } else if (mode === "section") {
      // split by blank lines, take meaningful sections
      inputs = resumeText
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 40 && s.length < 600)
        .slice(0, 5);
    } else {
      // full: split into chunks of ~3 lines
      const lines = resumeText.split("\n").map((l) => l.trim()).filter((l) => l.length > 10);
      for (let i = 0; i < lines.length && inputs.length < 10; i += 3) {
        inputs.push(lines.slice(i, i + 3).join(" "));
      }
    }
    if (inputs.length === 0) {
      toast.error("Not enough content to rewrite");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rewrite-resume`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ bullets: inputs, jobDescription, mode }),
        }
      );

      if (resp.status === 429) {
        toast.error("Rate limit exceeded. Please try again in a moment.");
        return;
      }
      if (resp.status === 402) {
        toast.error("AI credits exhausted. Please add funds.");
        return;
      }
      if (!resp.ok) throw new Error("Failed to rewrite");

      const data = await resp.json();
      if (data.rewrites?.length) {
        setRewrites(data.rewrites);
        toast.success(`Rewrote ${data.rewrites.length} ${mode === "bullet" ? "bullets" : mode === "section" ? "sections" : "lines"}!`);
      } else {
        toast.error("No rewrites generated");
      }
    } catch (err) {
      toast.error("Failed to rewrite resume. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="dashboard-card animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary" />
          One-Click Resume Rewrite
        </h3>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-muted rounded-lg p-0.5 text-xs">
            {(["bullet", "section", "full"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-all ${
                  mode === m ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <Button
          onClick={handleRewrite}
          disabled={loading}
          size="sm"
          className="bg-primary text-primary-foreground font-medium"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Rewriting...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-1" />Rewrite</>
          )}
          </Button>
        </div>
      </div>

      {rewrites.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-6">
          Click "Rewrite Bullets" to get AI-powered improvements for your resume bullet points.
        </p>
      )}

      {loading && (
        <div className="flex flex-col items-center py-8 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">AI is rewriting your bullet points...</p>
        </div>
      )}

      {rewrites.length > 0 && (
        <div className="space-y-4">
          {rewrites.map((r, i) => (
            <div key={i} className="rounded-xl bg-muted/50 p-4 space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase text-destructive/70 mb-1">Original</p>
                <p className="text-sm text-muted-foreground line-through">{r.original}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase text-success/70 mb-1">Improved</p>
                <p className="text-sm text-foreground font-medium">{r.improved}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(r.improved, i)}
                  className="text-xs h-7"
                >
                  {copiedIdx === i ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copiedIdx === i ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
