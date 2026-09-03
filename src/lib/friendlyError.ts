/**
 * Returns a user-friendly message for an Error or string.
 * If the message looks technical (stack-like, contains TypeError, JSON, etc.),
 * returns a generic fallback instead.
 */
export function friendlyMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const raw = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  if (!raw) return fallback;

  const lower = raw.toLowerCase();
  const looksTechnical =
    lower.includes("typeerror") ||
    lower.includes("referenceerror") ||
    lower.includes("syntaxerror") ||
    lower.includes("undefined is not") ||
    lower.includes("cannot read prop") ||
    lower.includes("failed to execute") ||
    lower.includes("unexpected token") ||
    lower.startsWith("{") ||
    raw.length > 160;

  return looksTechnical ? fallback : raw;
}
