// Personalized interview-prep questions derived from the latest analysis.
// Pure transformation; no AI calls.

import type { AnalysisHistoryEntry } from "@/lib/analysisStore";

export type Confidence = "High" | "Medium" | "Low";

export interface PrepQuestion {
  question: string;
  confidence: Confidence;
  topic: string;
}

export interface PrepPlan {
  questions: PrepQuestion[];
  weakAreas: string[];
  recommendedMinutes: number;
}

export function buildPrepPlan(entry: AnalysisHistoryEntry | null): PrepPlan {
  if (!entry) return { questions: [], weakAreas: [], recommendedMinutes: 0 };
  const r = entry.fullResult;
  const matched = r.matchedSkills.slice(0, 4);
  const missing = r.missingSkills.slice(0, 4);
  const role = entry.jobDescriptionTitle && entry.jobDescriptionTitle !== "Unknown Role"
    ? entry.jobDescriptionTitle
    : null;

  const questions: PrepQuestion[] = [];

  for (const skill of matched) {
    questions.push({
      question: `Walk me through a project where you used ${skill}.`,
      confidence: "High",
      topic: skill,
    });
  }
  if (role) {
    questions.push({
      question: `Why do you want this ${role} role?`,
      confidence: "Medium",
      topic: "Motivation",
    });
  }
  questions.push({
    question: "Tell me about a recent challenge you overcame and what you learned.",
    confidence: "Medium",
    topic: "Behavioural",
  });
  for (const skill of missing.slice(0, 2)) {
    questions.push({
      question: `How would you approach learning ${skill} on the job?`,
      confidence: "Low",
      topic: skill,
    });
  }

  const weakAreas = missing.slice(0, 3);
  const recommendedMinutes = Math.min(60, 10 + weakAreas.length * 5 + matched.length * 2);

  return { questions, weakAreas, recommendedMinutes };
}
