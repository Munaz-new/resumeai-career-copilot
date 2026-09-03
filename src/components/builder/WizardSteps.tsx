import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  type ProfileType,
  type ExpLevel,
  TARGET_ROLES,
} from "@/lib/resumeDraft";
import { GraduationCap, Sparkles, Briefcase, Repeat, ArrowRight, ArrowLeft } from "lucide-react";

interface WizardData {
  profile: ProfileType;
  targetRole: string;
  level: ExpLevel;
  jobDescription: string;
}

export function WizardSteps({ onComplete }: { onComplete: (d: WizardData) => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    profile: "fresher",
    targetRole: "",
    level: "none",
    jobDescription: "",
  });

  const next = () => setStep((s) => Math.min(4, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const canNext =
    (step === 1 && !!data.profile) ||
    (step === 2 && data.targetRole.trim().length > 0) ||
    (step === 3 && !!data.level) ||
    step === 4;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={cn(
              "h-1.5 rounded-full transition-all",
              n === step ? "w-12 bg-primary" : n < step ? "w-8 bg-primary/60" : "w-8 bg-muted"
            )}
          />
        ))}
      </div>

      <div className="dashboard-card animate-fade-in">
        {step === 1 && (
          <Step title="Who are you building this resume for?" subtitle="We'll tailor the sections and tone.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(
                [
                  { id: "student", label: "Student", desc: "Still in college", icon: GraduationCap },
                  { id: "fresher", label: "Fresher", desc: "Recent graduate", icon: Sparkles },
                  { id: "experienced", label: "Experienced", desc: "1+ years working", icon: Briefcase },
                  { id: "switcher", label: "Career Switcher", desc: "Changing fields", icon: Repeat },
                ] as { id: ProfileType; label: string; desc: string; icon: typeof GraduationCap }[]
              ).map((o) => (
                <button
                  key={o.id}
                  onClick={() => setData({ ...data, profile: o.id })}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border text-left transition-all",
                    data.profile === o.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40 bg-card"
                  )}
                >
                  <o.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground text-sm">{o.label}</p>
                    <p className="text-xs text-muted-foreground">{o.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step title="What role are you targeting?" subtitle="Pick a preset or type your own.">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {TARGET_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => setData({ ...data, targetRole: r })}
                  className={cn(
                    "text-xs font-medium px-3 py-2 rounded-lg border transition-all",
                    data.targetRole === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:border-primary/40"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <Input
              placeholder="Or type a custom role..."
              value={data.targetRole}
              onChange={(e) => setData({ ...data, targetRole: e.target.value })}
            />
          </Step>
        )}

        {step === 3 && (
          <Step title="What's your experience level?" subtitle="This shapes which sections we emphasize.">
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { id: "none", label: "No experience" },
                  { id: "internship", label: "Internship" },
                  { id: "beginner", label: "Beginner (<1y)" },
                  { id: "experienced", label: "Experienced (1y+)" },
                ] as { id: ExpLevel; label: string }[]
              ).map((o) => (
                <button
                  key={o.id}
                  onClick={() => setData({ ...data, level: o.id })}
                  className={cn(
                    "p-4 rounded-xl border text-sm font-medium transition-all",
                    data.level === o.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-foreground hover:border-primary/40"
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Step>
        )}

        {step === 4 && (
          <Step
            title="Paste a job description (optional)"
            subtitle="If you provide one, we'll auto-tailor your resume to it."
          >
            <Textarea
              placeholder="Paste the JD here to unlock JD-driven tailoring, heatmap, and missing-skill suggestions..."
              value={data.jobDescription}
              onChange={(e) => setData({ ...data, jobDescription: e.target.value })}
              className="min-h-[180px]"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Skip this if you don't have a JD yet — you can add it later.
            </p>
          </Step>
        )}

        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={back} disabled={step === 1}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          {step < 4 ? (
            <Button onClick={next} disabled={!canNext}>
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => onComplete(data)} className="bg-primary">
              Start Building <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Step({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-6">{subtitle}</p>
      {children}
    </div>
  );
}
