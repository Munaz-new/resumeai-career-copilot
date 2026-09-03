import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";

import {
  Plus, Trash2, BarChart3, Trophy, AlertCircle, ArrowRight, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { analyzeResume, isValidResume, isValidJobDescription, type AnalysisResult } from "@/lib/analysisStore";
import { parseResumeFile, detectFileKind } from "@/lib/fileParser";
import { assessImageQuality } from "@/lib/imageQuality";
import { ImageResumeDialog } from "@/components/ImageResumeDialog";
import { cn } from "@/lib/utils";
import { UploadCard } from "@/components/UploadCard";
import { JobMatchExplain } from "@/components/JobMatchExplain";

interface CompareEntry {
  id: string;
  title: string;
  jd: string;
  result: AnalysisResult | null;
}

export default function ComparePage() {
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [entries, setEntries] = useState<CompareEntry[]>([
    { id: "1", title: "", jd: "", result: null },
    { id: "2", title: "", jd: "", result: null },
  ]);
  const [comparing, setComparing] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; warning?: string } | null>(null);

  const handleFile = async (file: File) => {
    const kind = detectFileKind(file);
    if (kind === "unknown") {
      toast.error("Please upload a PDF, DOCX, PNG, or JPG file");
      return;
    }
    if (kind === "image") {
      const quality = await assessImageQuality(file);
      setPendingImage({ file, warning: quality.warning });
      return;
    }
    await runParse(file);
  };

  const runParse = async (file: File) => {
    try {
      const result = await parseResumeFile(file);
      if (result.success) {
        setResumeText(result.text);
        setFileName(file.name);
        toast.success(`Loaded ${file.name}`);
      } else {
        toast.error(result.error || "Failed to parse");
      }
    } catch { toast.error("Parse error"); }
  };

  const handleImageContinue = async () => {
    const pending = pendingImage;
    setPendingImage(null);
    if (pending) await runParse(pending.file);
  };

  const updateEntry = (id: string, field: keyof CompareEntry, value: string) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const addEntry = () => {
    if (entries.length >= 5) return toast.error("Maximum 5 jobs");
    setEntries((prev) => [...prev, { id: crypto.randomUUID(), title: "", jd: "", result: null }]);
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 2) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const runComparison = () => {
    if (!isValidResume(resumeText)) {
      toast.error("Please provide a valid resume first");
      return;
    }
    const valid = entries.filter((e) => isValidJobDescription(e.jd));
    if (valid.length < 2) {
      toast.error("Please fill at least 2 job descriptions");
      return;
    }

    setComparing(true);
    setTimeout(() => {
      setEntries((prev) =>
        prev.map((e) => {
          if (!isValidJobDescription(e.jd)) return { ...e, result: null };
          const { result } = analyzeResume(resumeText, e.jd, false);
          const title = e.title || e.jd.split("\n")[0]?.trim().slice(0, 40) || "Untitled";
          return { ...e, title: title, result };
        })
      );
      setComparing(false);
      toast.success("Comparison complete!");
    }, 800);
  };

  const results = entries.filter((e) => e.result);
  const bestMatch = results.length > 0 ? results.reduce((a, b) => (a.result!.atsScore > b.result!.atsScore ? a : b)) : null;
  const worstMatch = results.length > 0 ? results.reduce((a, b) => (a.result!.atsScore < b.result!.atsScore ? a : b)) : null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Job Match Comparison</h1>
          <p className="text-sm text-muted-foreground mt-1">Compare your resume against multiple job descriptions.</p>
        </div>

        {/* Resume input */}
        <div className="dashboard-card mb-6 animate-fade-in">
          <h2 className="font-heading font-bold text-foreground mb-3">Your Resume</h2>
          <UploadCard
            onFile={handleFile}
            fileName={fileName}
            extractedChars={resumeText.length || undefined}
          />
          <div className="mt-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Or paste text</p>
            <textarea
              className="w-full h-28 bg-muted/50 border border-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Paste resume text here…"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>
        </div>

        {/* JD inputs */}
        <div className="space-y-4 mb-6">
          {entries.map((entry, i) => (
            <div key={entry.id} className="dashboard-card animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-foreground text-sm">Job {i + 1}</h3>
                {entries.length > 2 && (
                  <button onClick={() => removeEntry(entry.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <input
                className="w-full bg-muted/50 border border-border rounded-lg p-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Job title (e.g. Frontend Developer)"
                value={entry.title}
                onChange={(e) => updateEntry(entry.id, "title", e.target.value)}
              />
              <textarea
                className="w-full h-24 bg-muted/50 border border-border rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Paste job description..."
                value={entry.jd}
                onChange={(e) => updateEntry(entry.id, "jd", e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 mb-8 animate-fade-in">
          <Button variant="outline" onClick={addEntry} disabled={entries.length >= 5} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Job
          </Button>
          <Button onClick={runComparison} disabled={comparing} className="bg-primary text-primary-foreground font-semibold">
            {comparing ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Comparing...</> : <><BarChart3 className="w-4 h-4 mr-1" />Compare All</>}
          </Button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="animate-fade-in space-y-6">
            {/* Result cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((e) => {
                const r = e.result!;
                const tier = r.atsScore >= 75 ? "strong" : r.atsScore >= 55 ? "moderate" : "weak";
                const tierLabel =
                  tier === "strong" ? "Strong Match" : tier === "moderate" ? "Moderate Match" : "Weak Match";
                const tierColor =
                  tier === "strong"
                    ? "text-success"
                    : tier === "moderate"
                    ? "text-warning"
                    : "text-destructive";
                const tierBg =
                  tier === "strong"
                    ? "bg-success/10 border-success/20"
                    : tier === "moderate"
                    ? "bg-warning/10 border-warning/20"
                    : "bg-destructive/10 border-destructive/20";
                const dot =
                  tier === "strong" ? "bg-success" : tier === "moderate" ? "bg-warning" : "bg-destructive";
                return (
                  <div
                    key={e.id}
                    className={cn(
                      "dashboard-card flex flex-col items-center text-center py-6",
                      e.id === bestMatch?.id && "ring-2 ring-success/30"
                    )}
                  >
                    <p className="text-sm font-heading font-bold text-foreground mb-2 line-clamp-1">
                      {e.title || "Untitled"}
                    </p>
                    <p className={cn("text-4xl font-extrabold tracking-tight", tierColor)}>
                      {r.atsScore}%
                    </p>
                    <span
                      className={cn(
                        "mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border",
                        tierBg,
                        tierColor
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
                      {tierLabel}
                    </span>
                    <JobMatchExplain result={r} />
                  </div>
                );
              })}
            </div>

            <div className="dashboard-card overflow-x-auto">
              <h3 className="font-heading font-bold text-foreground mb-4">Comparison Results</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Job Title</th>
                    <th className="text-center py-3 px-2 text-muted-foreground font-medium">ATS Score</th>
                    <th className="text-center py-3 px-2 text-muted-foreground font-medium">Keywords</th>
                    <th className="text-center py-3 px-2 text-muted-foreground font-medium">Skills</th>
                    <th className="text-center py-3 px-2 text-muted-foreground font-medium">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((e) => {
                    const r = e.result!;
                    const isBest = e.id === bestMatch?.id;
                    const isWorst = e.id === worstMatch?.id && results.length > 1;
                    return (
                      <tr key={e.id} className={cn("border-b border-border/50", isBest && "bg-success/5")}>
                        <td className="py-3 px-2 font-medium text-foreground">
                          {e.title || "Untitled"}
                          {isBest && <Trophy className="w-3.5 h-3.5 text-warning inline ml-2" />}
                        </td>
                        <td className="text-center py-3 px-2">
                          <span className={cn("font-bold", r.atsScore >= 70 ? "text-success" : r.atsScore >= 50 ? "text-warning" : "text-destructive")}>
                            {r.atsScore}%
                          </span>
                        </td>
                        <td className="text-center py-3 px-2 text-muted-foreground">{r.keywordMatch}%</td>
                        <td className="text-center py-3 px-2 text-muted-foreground">{r.skillsMatch}%</td>
                        <td className="text-center py-3 px-2">
                          {isBest ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success uppercase">Apply First</span>
                          ) : isWorst ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive uppercase">Needs Work</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning uppercase">Consider</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
      <ImageResumeDialog
        open={!!pendingImage}
        fileName={pendingImage?.file.name ?? ""}
        qualityWarning={pendingImage?.warning}
        onContinue={handleImageContinue}
        onCancel={() => setPendingImage(null)}
      />
    </Layout>
  );
}
