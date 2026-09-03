import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { ScoreRing } from "@/components/ScoreRing";
import { StatCard } from "@/components/StatCard";
import { SkillBadge } from "@/components/SkillBadge";
import { ProgressBar } from "@/components/ProgressBar";
import { JobReadyMeter } from "@/components/JobReadyMeter";
import { ImprovementChecklist } from "@/components/ImprovementChecklist";
import { ResumeRewriter } from "@/components/ResumeRewriter";
import { JDHeatmap } from "@/components/JDHeatmap";
import { GapAssistant } from "@/components/GapAssistant";
import { CertificationOptimizer } from "@/components/CertificationOptimizer";
import { ScoreSimulator } from "@/components/ScoreSimulator";
import { RecruiterModeToggle, applyRecruiterTone, type ReviewMode } from "@/components/RecruiterModeToggle";
import { ScoreExplainPanel } from "@/components/ScoreExplainPanel";
import { MissingSkillsPanel } from "@/components/MissingSkillsPanel";
import { QuickWinsPanel } from "@/components/QuickWinsPanel";
import { Button } from "@/components/ui/button";
import {
  Upload, FileText, Sparkles, Target, CheckCircle2, XCircle,
  Lightbulb, Flame, ArrowRight, Clipboard, AlertCircle, Bug, Loader2, Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  type AnalysisResult, type DebugInfo,
  isValidResume, isValidJobDescription, analyzeResume, saveGuestAnalysis, saveAuthAnalysis,
} from "@/lib/analysisStore";
import { exportAnalysisReport } from "@/lib/exportPdf";
import { parseResumeFile, detectFileKind, type ParseResult, type AtsConfidence } from "@/lib/fileParser";
import { assessImageQuality } from "@/lib/imageQuality";
import { ImageResumeDialog } from "@/components/ImageResumeDialog";
import { UploadCard } from "@/components/UploadCard";
import { useAuth } from "@/contexts/AuthContext";

export default function AnalyzerPage() {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [fileName, setFileName] = useState("");
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("paste");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [debug, setDebug] = useState<DebugInfo | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [roastMode, setRoastMode] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [parsing, setParsing] = useState(false);
  const [extractedPreview, setExtractedPreview] = useState("");
  const [atsConfidence, setAtsConfidence] = useState<AtsConfidence | null>(null);
  const [pendingImage, setPendingImage] = useState<{ file: File; warning?: string } | null>(null);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode>(() => {
    try { return (localStorage.getItem("resumeai-review-mode") as ReviewMode) || "friendly"; } catch { return "friendly"; }
  });

  const setMode = (m: ReviewMode) => {
    setReviewMode(m);
    try { localStorage.setItem("resumeai-review-mode", m); } catch { /* ignore */ }
  };
  const canAnalyze = useMemo(() => {
    return isValidResume(resumeText) && isValidJobDescription(jobDescription);
  }, [resumeText, jobDescription]);

  // Live ATS preview (debounced) — only before a full analysis is rendered.
  useEffect(() => {
    if (analysis) return;
    if (!canAnalyze) { setLiveScore(null); return; }
    const t = setTimeout(() => {
      try {
        const { result } = analyzeResume(resumeText, jobDescription, false);
        setLiveScore(result.atsScore);
      } catch { setLiveScore(null); }
    }, 400);
    return () => clearTimeout(t);
  }, [resumeText, jobDescription, canAnalyze, analysis]);

  const handleFileProcess = async (file: File) => {
    if (!file) return;
    const kind = detectFileKind(file);
    if (kind === "unknown") {
      toast.error("Please upload a PDF, DOCX, PNG, or JPG file");
      return;
    }

    // Optional image flow — never blocks, always lets the user choose.
    if (kind === "image") {
      const quality = await assessImageQuality(file);
      setPendingImage({ file, warning: quality.warning });
      return;
    }

    await runParse(file);
  };

  const runParse = async (file: File) => {
    setFileName(file.name);
    setParsing(true);
    setExtractedPreview("");
    setValidationError("");
    setAtsConfidence(null);

    try {
      const result: ParseResult = await parseResumeFile(file);
      setAtsConfidence(result.confidence ?? null);
      if (result.success) {
        setResumeText(result.text);
        setExtractedPreview(result.preview);
        toast.success(`Extracted ${result.text.length} characters from ${file.name}`);
      } else {
        setResumeText("");
        setExtractedPreview(result.preview);
        setValidationError(result.error || "Unable to extract text from file.");
        toast.error(result.error || "Failed to parse file");
        if (result.fileKind === "image") setActiveTab("paste");
      }
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("[parse] file error", err);
      setValidationError("We couldn't read this file. Try a PDF or DOCX under 5 MB, or paste your resume text instead.");
      toast.error("Couldn't read that file");
    } finally {
      setParsing(false);
    }
  };

  const handleImageContinue = async () => {
    const pending = pendingImage;
    setPendingImage(null);
    if (pending) await runParse(pending.file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileProcess(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };


  const handleAnalyze = () => {
    setValidationError("");
    if (!isValidResume(resumeText)) {
      const msg = "Please provide a valid resume (at least 100 characters or 20 words).";
      setValidationError(msg);
      toast.error(msg);
      return;
    }
    if (!isValidJobDescription(jobDescription)) {
      const msg = "Please provide a valid job description (at least 50 characters or 10 words).";
      setValidationError(msg);
      toast.error(msg);
      return;
    }

    setAnalyzing(true);
    setTimeout(() => {
      const { result, debug: dbg } = analyzeResume(resumeText, jobDescription, roastMode);
      setAnalysis(result);
      setDebug(dbg);
      if (user) {
        saveAuthAnalysis(user.id, fileName, jobDescription, result);
      } else {
        saveGuestAnalysis(fileName, jobDescription, result);
      }
      setAnalyzing(false);
      toast.success("Analysis complete!");
    }, 1200);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-2xl font-extrabold text-foreground">Resume Analyzer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your resume and paste a valid job description to start analysis.
          </p>
        </div>

        {/* Input Section */}
        {!analysis && (
          <>
            <div className="grid lg:grid-cols-2 gap-6 mb-6 animate-fade-in">
              {/* Resume Input */}
              <div className="dashboard-card">
                <h2 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Your Resume
                </h2>
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveTab("upload")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "upload" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >Upload File</button>
                  <button
                    onClick={() => setActiveTab("paste")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "paste" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >Paste Text</button>
                </div>

                {activeTab === "upload" ? (
                  <div>
                    <UploadCard
                      onFile={handleFileProcess}
                      parsing={parsing}
                      fileName={fileName}
                      extractedChars={resumeText.length || undefined}
                      atsConfidence={atsConfidence}
                    />
                    {extractedPreview && (
                      <div className="mt-3 p-3 rounded-xl bg-muted/50 border border-border">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Extracted Text Preview:</p>
                        <p className="text-xs text-foreground/80 font-mono leading-relaxed break-all">{extractedPreview}...</p>
                      </div>
                    )}
                  </div>

                ) : (
                  <div>
                    <textarea
                      className="w-full h-[200px] bg-muted/50 border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30"
                      placeholder="Paste your full resume content here (minimum 100 characters)..."
                      value={resumeText}
                      onChange={(e) => { setResumeText(e.target.value); setValidationError(""); }}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {resumeText.trim().split(/\s+/).filter(Boolean).length} words · {resumeText.trim().length} characters
                    </p>
                  </div>
                )}
              </div>

              {/* Job Description */}
              <div className="dashboard-card">
                <h2 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                  <Clipboard className="w-5 h-5 text-primary" />
                  Job Description
                </h2>
                <textarea
                  className="w-full h-[280px] bg-muted/50 border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30"
                  placeholder={`Paste the job description here (minimum 50 characters)...\n\nExample:\nWe are looking for a Senior Frontend Developer with experience in React, TypeScript, and modern web technologies...`}
                  value={jobDescription}
                  onChange={(e) => { setJobDescription(e.target.value); setValidationError(""); }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {jobDescription.trim().split(/\s+/).filter(Boolean).length} words · {jobDescription.trim().length} characters
                </p>
              </div>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {validationError}
              </div>
            )}

            <div className="flex items-center gap-4 animate-fade-in">
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || !canAnalyze}
                className="bg-primary text-primary-foreground font-semibold px-8 py-6 rounded-xl shadow-sm hover:shadow-md transition-shadow disabled:opacity-50"
              >
                {analyzing ? (
                  <><Sparkles className="w-5 h-5 mr-2 animate-spin" />Analyzing...</>
                ) : (
                  <><Sparkles className="w-5 h-5 mr-2" />Analyze Resume</>
                )}
              </Button>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="checkbox" checked={roastMode} onChange={(e) => setRoastMode(e.target.checked)} className="rounded border-border accent-primary" />
                <Flame className="w-4 h-4 text-warning" />
                <span className="text-muted-foreground font-medium">Resume Roast Mode</span>
              </label>
              {liveScore !== null && (
                <span className="ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live ATS preview: {liveScore}
                </span>
              )}
            </div>
          </>
        )}

        {/* Results */}
        {analysis && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3 animate-fade-in">
              <p className="text-xs text-muted-foreground">
                Review tone affects suggestion wording, not the underlying scores.
              </p>
              <RecruiterModeToggle mode={reviewMode} onChange={setMode} />
            </div>

            {/* Debug Panel */}
            <div className="animate-fade-in">
              <button
                onClick={() => setShowDebug(!showDebug)}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <Bug className="w-3.5 h-3.5" />
                {showDebug ? "Hide" : "Show"} Debug Panel
              </button>
              {showDebug && debug && (
                <div className="dashboard-card bg-muted/30 border-dashed text-xs font-mono space-y-1">
                  {extractedPreview && (
                    <div className="mb-2 pb-2 border-b border-border">
                      <p className="font-semibold">Extracted Text Preview:</p>
                      <p className="break-all text-foreground/70">{extractedPreview}...</p>
                    </div>
                  )}
                  <p>Matched Keywords: {debug.matchedKeywordsCount} / {debug.totalJDKeywords}</p>
                  <p>Matched Skills (total): {debug.matchedSkillsCount} / {debug.totalRequiredSkills}</p>
                  <p className="mt-1 font-semibold">Technical Skills:</p>
                  <p className="text-success">  Matched: {debug.matchedTechnical.join(", ") || "None"}</p>
                  <p className="text-destructive">  Missing: {debug.missingTechnical.join(", ") || "None"}</p>
                  <p className="mt-1 font-semibold">Tools:</p>
                  <p className="text-success">  Matched: {debug.matchedTools.join(", ") || "None"}</p>
                  <p className="text-destructive">  Missing: {debug.missingTools.join(", ") || "None"}</p>
                  <p className="mt-1 font-semibold">Soft Skills:</p>
                  <p className="text-success">  Matched: {debug.matchedSoft.join(", ") || "None"}</p>
                  <p className="text-destructive">  Missing: {debug.missingSoft.join(", ") || "None"}</p>
                  <p className="mt-1">Sections Found: {debug.sectionsFound} / 5</p>
                  <p>Readability Score: {debug.readabilityRaw}</p>
                  <p className="font-bold">Final ATS Formula Output: {debug.formulaOutput}</p>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-4 gap-5 animate-fade-in">
              <div className="dashboard-card flex flex-col items-center justify-center">
                <ScoreRing score={analysis.atsScore} label="ATS Score" size={140} />
                {typeof analysis.recruiterScanScore === "number" && (
                  <span className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-foreground text-xs font-semibold">
                    Recruiter Score: {analysis.recruiterScanScore}
                  </span>
                )}
              </div>
              <StatCard icon={Target} label="Keyword Match" value={`${analysis.keywordMatch}%`} iconBg="bg-info/10" iconColor="text-info" />
              <StatCard icon={CheckCircle2} label="Skills Match" value={`${analysis.skillsMatch}%`} iconBg="bg-success/10" iconColor="text-success" />
              <StatCard icon={FileText} label="Formatting" value={`${analysis.formattingScore}%`} iconBg="bg-primary/10" iconColor="text-primary" />
            </div>

            <ScoreExplainPanel result={analysis} />

            <div className="dashboard-card animate-fade-in" style={{ animationDelay: "100ms" }}>
              <h3 className="font-heading font-bold text-foreground mb-5">Detailed Breakdown</h3>
              <div className="space-y-4">
                <ProgressBar label="Keyword Match" value={analysis.keywordMatch} />
                <ProgressBar label="Skills Match" value={analysis.skillsMatch} />
                <ProgressBar label="Formatting Quality" value={analysis.formattingScore} />
                <ProgressBar label="Readability" value={analysis.readabilityScore} />
                <ProgressBar label="Section Completeness" value={analysis.sectionCompleteness} />
              </div>
            </div>

            <QuickWinsPanel result={analysis} />

            {(analysis.matchedSkills.length > 0 || analysis.missingSkills.length > 0) && (
              <div className="grid md:grid-cols-2 gap-5">
                {analysis.matchedSkills.length > 0 && (
                  <div className="dashboard-card animate-fade-in" style={{ animationDelay: "200ms" }}>
                    <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      Matched Skills ({analysis.matchedSkills.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {analysis.matchedSkills.map((s) => <SkillBadge key={s} skill={s} matched />)}
                    </div>
                  </div>
                )}
                {analysis.missingSkills.length > 0 && (
                  <MissingSkillsPanel result={analysis} />
                )}
              </div>
            )}

            <div className="dashboard-card animate-fade-in" style={{ animationDelay: "300ms" }}>
              <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-warning" />
                Smart Suggestions
              </h3>
              {analysis.actionableSuggestions && analysis.actionableSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {analysis.actionableSuggestions.slice(0, 5).map((s, i) => (
                    <div key={i} className="p-3 rounded-xl bg-muted/50">
                      <div className="flex items-start gap-2 mb-1">
                        <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-sm font-medium text-foreground">{applyRecruiterTone(s.title, reviewMode)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground ml-6">{s.reason}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-3">
                  {analysis.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                      <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground leading-relaxed">{applyRecruiterTone(s, reviewMode)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {analysis.strongBullets.length > 0 && (
              <div className="dashboard-card animate-fade-in" style={{ animationDelay: "350ms" }}>
                <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Bullet Point Improvements
                </h3>
                <div className="space-y-4">
                  {analysis.strongBullets.map((b, i) => (
                    <div key={i} className="rounded-xl bg-muted/50 p-4">
                      <div className="flex items-start gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                        <p className="text-sm text-muted-foreground line-through">{b.original}</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                        <p className="text-sm text-foreground font-medium">{b.improved}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {roastMode && analysis.roastFeedback.length > 0 && (
              <div className="dashboard-card border-warning/30 animate-fade-in" style={{ animationDelay: "400ms" }}>
                <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
                  <Flame className="w-5 h-5 text-warning" />
                  Resume Roast
                  <span className="text-xs bg-warning/10 text-warning px-2.5 py-0.5 rounded-full font-semibold">Constructive</span>
                </h3>
                <ul className="space-y-3">
                  {analysis.roastFeedback.map((r, i) => (
                    <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-warning/5">
                      <Flame className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground leading-relaxed">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* JD Heatmap */}
            <JDHeatmap result={analysis} />

            {/* Score Simulator */}
            <ScoreSimulator result={analysis} />

            {/* Job Readiness with strengths/weaknesses */}
            <JobReadyMeter
              score={analysis.jobReadiness ?? analysis.atsScore}
              strengths={analysis.strengths}
              weaknesses={analysis.weaknesses}
              className="animate-fade-in"
            />

            {/* Gap Assistant — only if gaps detected */}
            <GapAssistant result={analysis} />

            {/* Certification Optimizer */}
            <CertificationOptimizer jobDescription={jobDescription} />

            {/* Improvement Checklist */}
            <ImprovementChecklist result={analysis} />

            {/* AI Resume Rewriter */}
            <ResumeRewriter resumeText={resumeText} jobDescription={jobDescription} />

            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button
                onClick={() => exportAnalysisReport(analysis, fileName, jobDescription.split("\n")[0]?.trim() || "")}
                className="bg-primary text-primary-foreground font-medium"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF Report
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAnalysis(null);
                  setDebug(null);
                  setResumeText("");
                  setJobDescription("");
                  setFileName("");
                  setValidationError("");
                }}
                className="border-border text-muted-foreground hover:text-foreground font-medium"
              >
                Analyze Another Resume
              </Button>
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
