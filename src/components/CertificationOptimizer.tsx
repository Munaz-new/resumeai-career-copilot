import { Award, X, MapPin } from "lucide-react";

type RoleKey = "frontend" | "backend" | "fullstack" | "data" | "devops" | "general";

const ROLE_CERTS: Record<RoleKey, { recommended: string[]; avoid: string[]; placement: string }> = {
  frontend: {
    recommended: ["Meta Front-End Developer (Coursera)", "freeCodeCamp Responsive Web Design", "JavaScript Algorithms (freeCodeCamp)", "Google UX Design"],
    avoid: ["Generic 'HTML in 1 hour' Udemy certs", "Untracked LinkedIn Learning intros"],
    placement: "Place under a 'Certifications' section after Skills.",
  },
  backend: {
    recommended: ["AWS Certified Cloud Practitioner", "Microsoft Learn — Azure Fundamentals", "MongoDB University M001", "NPTEL DBMS"],
    avoid: ["Untimed 'Become a Full-Stack Dev' boot-camp completions without project links"],
    placement: "Cluster cloud + database certs together in 'Certifications'.",
  },
  fullstack: {
    recommended: ["Meta Full-Stack Engineer", "AWS Cloud Practitioner", "MongoDB M001", "Google IT Automation"],
    avoid: ["Multiple overlapping JS intro certs"],
    placement: "Use a 2-column Certifications block to save space.",
  },
  data: {
    recommended: ["IBM Data Science (Coursera)", "Google Data Analytics", "Microsoft Learn — AI Fundamentals", "NPTEL ML", "DeepLearning.AI Machine Learning"],
    avoid: ["1-hour 'Become a Data Scientist' certs", "Old Excel-only certs for ML roles"],
    placement: "Lead the Certifications section with the strongest analytics credential.",
  },
  devops: {
    recommended: ["AWS Solutions Architect Associate", "Docker Certified Associate", "CKAD (Kubernetes)", "HashiCorp Terraform Associate"],
    avoid: ["Generic 'DevOps Master' bundles from low-trust sites"],
    placement: "Place cloud certs near the top — recruiters scan for them.",
  },
  general: {
    recommended: ["NPTEL (any relevant)", "Google Career Certificates", "Microsoft Learn paths", "LinkedIn Learning skill assessments"],
    avoid: ["Padding the resume with unrelated certs"],
    placement: "Keep to 3–5 high-signal certs maximum.",
  },
};

function inferRole(jd: string): RoleKey {
  const t = jd.toLowerCase();
  if (/(data scien|machine learning|\bml\b|\bai\b|analytics)/.test(t)) return "data";
  if (/(devops|sre|kubernetes|docker|terraform|infrastructure)/.test(t)) return "devops";
  if (/(front.?end|react|vue|angular|ui|ux)/.test(t) && /(back.?end|node|api|server|database)/.test(t)) return "fullstack";
  if (/(front.?end|react|vue|angular|tailwind|css|html)/.test(t)) return "frontend";
  if (/(back.?end|node|django|spring|rails|api|database|server)/.test(t)) return "backend";
  return "general";
}

export function CertificationOptimizer({ jobDescription }: { jobDescription: string }) {
  const role = inferRole(jobDescription || "");
  const data = ROLE_CERTS[role];

  return (
    <div className="dashboard-card animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" />
          Certification Optimizer
        </h3>
        <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full capitalize">
          {role} role
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-success mb-2">Recommended</p>
          <ul className="space-y-1.5">
            {data.recommended.map((c) => (
              <li key={c} className="text-sm text-foreground flex items-start gap-2">
                <Award className="w-3.5 h-3.5 text-success mt-0.5 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-destructive mb-2">Avoid (resume fillers)</p>
          <ul className="space-y-1.5">
            {data.avoid.map((c) => (
              <li key={c} className="text-sm text-muted-foreground flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 p-3 rounded-xl bg-muted/50 flex items-start gap-2">
        <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Best placement:</span> {data.placement}</p>
      </div>
    </div>
  );
}