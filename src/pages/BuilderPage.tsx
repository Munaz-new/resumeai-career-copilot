import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { WizardSteps } from "@/components/builder/WizardSteps";
import { SectionList } from "@/components/builder/SectionList";
import { SectionEditor } from "@/components/builder/SectionEditor";
import { ResumePreview } from "@/components/builder/ResumePreview";
import { LiveATSPanel } from "@/components/builder/LiveATSPanel";
import { ResumeCompletionMeter } from "@/components/builder/ResumeCompletionMeter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type ResumeDraft,
  type TemplateId,
  createEmptyDraft,
  initSectionsFor,
  loadDraft,
  saveDraft,
  clearDraft,
} from "@/lib/resumeDraft";
import { exportResumePdf } from "@/lib/builderPdf";
import { Download, RotateCcw, Eye, Pencil, FileText, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SaveAccountModal } from "@/components/SaveAccountModal";
import { useAuth } from "@/contexts/AuthContext";

const TEMPLATES: { id: TemplateId; label: string; desc: string }[] = [
  { id: "ats-pro", label: "ATS Professional", desc: "Clean, recruiter-safe" },
  { id: "fresher-tech", label: "Fresher Tech", desc: "Student focused" },
  { id: "modern-pro", label: "Modern Professional", desc: "Balanced" },
  { id: "creative-tech", label: "Creative Tech", desc: "For designers" },
];

export default function BuilderPage() {
  const [draft, setDraft] = useState<ResumeDraft | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [exporting, setExporting] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [showSaveAccount, setShowSaveAccount] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const { isGuest } = useAuth();

  const handleExport = async (d: ResumeDraft) => {
    if (!previewRef.current) {
      toast.error("Preview not ready yet");
      return;
    }
    try {
      setExporting(true);
      const mode = await exportResumePdf(previewRef.current, d);
      if (mode === "fallback") {
        toast.success("PDF downloaded (safe mode)");
      } else {
        toast.success("PDF downloaded");
      }
      // Gentle nudge for guests after a successful export, once per session
      if (isGuest && !sessionStorage.getItem("save_account_prompted")) {
        sessionStorage.setItem("save_account_prompted", "1");
        setTimeout(() => setShowSaveAccount(true), 600);
      }
    } catch (err) {
      if (import.meta.env.DEV) console.error("[PDF] hard failure", err);
      toast.error("PDF export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    const existing = loadDraft();
    if (existing) {
      setDraft(existing);
      const first = existing.sections.find((s) => s.enabled)?.id ?? null;
      setActiveId(first);
    }
  }, []);

  // Debounced auto-save with subtle indicator
  useEffect(() => {
    if (!draft) return;
    const t = setTimeout(() => {
      saveDraft(draft);
      setSavedAt(Date.now());
    }, 800);
    return () => clearTimeout(t);
  }, [draft]);

  if (!draft || !draft.wizardComplete) {
    return (
      <Layout>
        <div className="py-6">
          <div className="text-center mb-2">
            <h1 className="font-heading text-2xl font-extrabold text-foreground">Smart Resume Builder</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Guided in 4 steps — then a live editor with real-time ATS feedback.
            </p>
          </div>
          <WizardSteps
            onComplete={({ profile, targetRole, level, jobDescription }) => {
              const d = createEmptyDraft();
              d.profile = profile;
              d.targetRole = targetRole;
              d.level = level;
              d.jobDescription = jobDescription || undefined;
              d.sections = initSectionsFor(profile, targetRole);
              d.wizardComplete = true;
              setDraft(d);
              setActiveId(d.sections[0]?.id ?? null);
            }}
          />
        </div>
      </Layout>
    );
  }

  const update = (patch: Partial<ResumeDraft>) => setDraft({ ...draft, ...patch });
  const updateSection = (id: string, next: typeof draft.sections[number]) => {
    setDraft({ ...draft, sections: draft.sections.map((s) => (s.id === id ? next : s)) });
  };
  const active = draft.sections.find((s) => s.id === activeId) ?? null;

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="font-heading text-xl font-extrabold text-foreground">Resume Builder</h1>
            <p className="text-xs text-muted-foreground">
              {draft.targetRole || "—"} • {draft.profile} • {draft.level}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {savedAt && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground mr-1">
                <Check className="w-3 h-3 text-success" />
                Saved automatically
              </span>
            )}
            <select
              value={draft.template}
              onChange={(e) => update({ template: e.target.value as TemplateId })}
              className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={() => handleExport(draft)} disabled={exporting}>
              <Download className="w-4 h-4 mr-1" /> {exporting ? "Exporting…" : "PDF"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Reset the builder and start over?")) {
                  clearDraft();
                  setDraft(null);
                  toast.success("Builder reset");
                }
              }}
            >
              <RotateCcw className="w-4 h-4 mr-1" /> Reset
            </Button>
          </div>
        </div>

        {/* Mobile tab switcher */}
        <div className="lg:hidden flex gap-1 mb-4 bg-muted rounded-xl p-1">
          <button
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-lg flex items-center justify-center gap-1",
              mobileView === "edit" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
            onClick={() => setMobileView("edit")}
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            className={cn(
              "flex-1 text-xs font-medium py-1.5 rounded-lg flex items-center justify-center gap-1",
              mobileView === "preview" ? "bg-background shadow-sm" : "text-muted-foreground"
            )}
            onClick={() => setMobileView("preview")}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
        </div>

        <div className="grid lg:grid-cols-[260px_minmax(0,1fr)_320px] gap-6">
          {/* Left: section list + contact */}
          <div className={cn("space-y-4", mobileView === "preview" && "hidden lg:block")}>
            <p className="hidden lg:block text-[11px] uppercase tracking-wide font-bold text-muted-foreground px-1">
              Edit
            </p>
            <ResumeCompletionMeter draft={draft} />
            <div className="dashboard-card">
              <h3 className="font-heading font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Contact
              </h3>
              <div className="space-y-2">
                <Input placeholder="Full name" value={draft.contact.name} onChange={(e) => update({ contact: { ...draft.contact, name: e.target.value } })} />
                <Input placeholder="Email" value={draft.contact.email} onChange={(e) => update({ contact: { ...draft.contact, email: e.target.value } })} />
                <Input placeholder="Phone" value={draft.contact.phone} onChange={(e) => update({ contact: { ...draft.contact, phone: e.target.value } })} />
                <Input placeholder="Location" value={draft.contact.location} onChange={(e) => update({ contact: { ...draft.contact, location: e.target.value } })} />
                <Input
                  placeholder="LinkedIn URL"
                  value={draft.contact.links.find((l) => l.label === "LinkedIn")?.url || ""}
                  onChange={(e) => {
                    const others = draft.contact.links.filter((l) => l.label !== "LinkedIn");
                    const url = e.target.value;
                    update({ contact: { ...draft.contact, links: url ? [...others, { label: "LinkedIn", url }] : others } });
                  }}
                />
                <Input
                  placeholder="GitHub URL"
                  value={draft.contact.links.find((l) => l.label === "GitHub")?.url || ""}
                  onChange={(e) => {
                    const others = draft.contact.links.filter((l) => l.label !== "GitHub");
                    const url = e.target.value;
                    update({ contact: { ...draft.contact, links: url ? [...others, { label: "GitHub", url }] : others } });
                  }}
                />
              </div>
            </div>
            <div className="dashboard-card">
              <h3 className="font-heading font-bold text-foreground text-sm mb-3">Sections</h3>
              <SectionList
                sections={draft.sections}
                activeId={activeId}
                onSelect={setActiveId}
                onChange={(sections) => update({ sections })}
              />
            </div>
          </div>

          {/* Middle: editor + preview */}
          <div className="space-y-4">
            <div className={cn(mobileView === "preview" && "hidden lg:block")}>
              {active ? (
                <SectionEditor
                  section={active}
                  draft={draft}
                  onChange={(next) => updateSection(active.id, next)}
                />
              ) : (
                <div className="dashboard-card text-center py-10 text-sm text-muted-foreground">
                  Select a section on the left to start editing
                </div>
              )}
            </div>

            <div className={cn(mobileView === "edit" && "hidden lg:block")}>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 text-center font-bold">
                Live Preview • {TEMPLATES.find((t) => t.id === draft.template)?.label}
              </div>
              <ResumePreview draft={draft} innerRef={previewRef} />
            </div>
          </div>

          {/* Right: live ATS */}
          <div className={cn("space-y-3", mobileView === "preview" && "hidden lg:block")}>
            <p className="hidden lg:block text-[11px] uppercase tracking-wide font-bold text-muted-foreground px-1">
              ATS Coach
            </p>
            <div className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
              <LiveATSPanel draft={draft} />
            </div>
          </div>
        </div>
      </div>
      <SaveAccountModal
        open={showSaveAccount}
        onOpenChange={setShowSaveAccount}
        title="Nice resume! Save it to your account?"
        description="You're in Guest Mode — create a free account to save this resume, sync across devices, and pick up where you left off."
      />
    </Layout>
  );
}
