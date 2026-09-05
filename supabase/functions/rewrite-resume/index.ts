import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_BULLETS = 15;
const MAX_BULLET_LEN = 500;
const MAX_JD_LEN = 5000;
const MAX_ROLE_LEN = 200;
const ALLOWED_MODES = ["bullet", "section", "full"] as const;

const PRIMARY_MODEL = "gemini-3.5-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";
const MAX_PRIMARY_ATTEMPTS = 2;
const RETRY_DELAYS_MS = [700, 1400];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isRetryableStatus(status: number) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini({
  apiKey,
  model,
  systemPrompt,
  userPrompt,
}: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
}) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              rewrites: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    original: { type: "STRING" },
                    improved: { type: "STRING" },
                  },
                  required: ["original", "improved"],
                },
              },
            },
            required: ["rewrites"],
          },
        },
      }),
    },
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Guest-friendly: the Builder works without login. We rely on strict input
    // bounds below (max bullets, max chars) to keep AI-credit usage contained.

    // --- Input validation ---
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return jsonResponse({ error: "Invalid JSON body" }, 400);

    const { bullets, jobDescription, mode = "bullet", targetRole } = body as Record<string, unknown>;

    if (!Array.isArray(bullets)) return jsonResponse({ error: "`bullets` must be an array" }, 400);
    if (bullets.length === 0) return jsonResponse({ error: "`bullets` cannot be empty" }, 400);
    if (bullets.length > MAX_BULLETS) {
      return jsonResponse({ error: `Too many bullets (max ${MAX_BULLETS})` }, 400);
    }

    const safeBullets: string[] = [];
    for (const b of bullets) {
      if (typeof b !== "string") return jsonResponse({ error: "Each bullet must be a string" }, 400);
      if (b.length > MAX_BULLET_LEN) {
        return jsonResponse({ error: `Bullet too long (max ${MAX_BULLET_LEN} chars)` }, 400);
      }
      safeBullets.push(b);
    }

    const jd = typeof jobDescription === "string" ? jobDescription : "";
    if (jd.length > MAX_JD_LEN) {
      return jsonResponse({ error: `Job description too long (max ${MAX_JD_LEN} chars)` }, 400);
    }

    const role = typeof targetRole === "string" ? targetRole : "";
    if (role.length > MAX_ROLE_LEN) {
      return jsonResponse({ error: `Target role too long (max ${MAX_ROLE_LEN} chars)` }, 400);
    }

    const safeMode = ALLOWED_MODES.includes(mode as typeof ALLOWED_MODES[number])
      ? (mode as typeof ALLOWED_MODES[number])
      : null;
    if (!safeMode) return jsonResponse({ error: "Invalid `mode`" }, 400);

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return jsonResponse({ error: "Server misconfigured" }, 500);
    }

    const modeNote: Record<string, string> = {
      bullet: "Rewrite each input as a single ATS-friendly resume bullet point.",
      section:
        "Rewrite each input as a stronger resume section (Summary, Experience entry, or Project description). One improved version per input.",
      full:
        "Treat each input as part of a full resume rewrite. Make each line more impactful, ATS-friendly, and aligned with the job description.",
    };

    const roleLine = role
      ? `Target role: ${role}. Use vocabulary, action verbs and metrics that a recruiter for this exact role would expect.`
      : "";

    const systemPrompt = `You are a professional resume writer and ATS optimization expert.

${modeNote[safeMode]}
${roleLine}

Rules:
- Start with a strong action verb appropriate for the target role.
- Include quantifiable results where possible. Never invent facts or achievements.
- Align with the job description keywords where appropriate.
- Keep each output concise (1-3 lines).
- Use professional language tuned to the target role.
- Preserve the original meaning and facts.
- Return ONLY valid JSON matching the requested schema.`;

    const userPrompt = `${role ? `Target Role: ${role}\n\n` : ""}Job Description:
${jd}

Mode: ${safeMode}

Inputs to rewrite:
${safeBullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}`;

    let response: Response | null = null;
    let lastErrorText = "";

    // Gemini can temporarily return 503/429/5xx during capacity or transient
    // service issues. Retry the primary model briefly before using the fallback.
    for (let attempt = 0; attempt < MAX_PRIMARY_ATTEMPTS; attempt++) {
      response = await callGemini({
        apiKey: GEMINI_API_KEY,
        model: PRIMARY_MODEL,
        systemPrompt,
        userPrompt,
      });

      if (response.ok) break;

      lastErrorText = await response.text();
      console.error(`Gemini ${PRIMARY_MODEL} attempt ${attempt + 1} failed:`, response.status, lastErrorText);

      if (!isRetryableStatus(response.status) || attempt === MAX_PRIMARY_ATTEMPTS - 1) break;
      await sleep(RETRY_DELAYS_MS[attempt] ?? 1400);
    }

    // If the primary model is temporarily unavailable, try the lower-latency
    // Flash-Lite model. It is a stable Gemini 3.5 model designed for high-volume use.
    if (!response?.ok && response && isRetryableStatus(response.status)) {
      console.warn(`Falling back from ${PRIMARY_MODEL} to ${FALLBACK_MODEL}`);
      const fallbackResponse = await callGemini({
        apiKey: GEMINI_API_KEY,
        model: FALLBACK_MODEL,
        systemPrompt,
        userPrompt,
      });

      if (fallbackResponse.ok) {
        response = fallbackResponse;
      } else {
        lastErrorText = await fallbackResponse.text();
        console.error(`Gemini ${FALLBACK_MODEL} fallback failed:`, fallbackResponse.status, lastErrorText);
        response = fallbackResponse;
      }
    }

    if (!response?.ok) {
      const status = response?.status ?? 502;

      if (status === 429) {
        return jsonResponse(
          { error: "AI rate limit reached. Please wait a moment and try again." },
          429,
        );
      }

      if (status === 401 || status === 403) {
        return jsonResponse(
          { error: "AI service authentication failed." },
          502,
        );
      }

      if (status === 404) {
        return jsonResponse(
          { error: "AI model is unavailable. Please try again later." },
          502,
        );
      }

      console.error("Gemini final failure:", status, lastErrorText);
      return jsonResponse(
        { error: "AI rewrite is temporarily unavailable. Please try again in a moment." },
        502,
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("Gemini returned no text:", JSON.stringify(data));
      return jsonResponse(
        { error: "AI returned an empty response. Please try again." },
        502,
      );
    }

    let parsed: { rewrites?: unknown };

    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("Gemini JSON parse error:", e, text);
      return jsonResponse(
        { error: "AI returned an invalid response. Please try again." },
        502,
      );
    }

    const rewrites = Array.isArray(parsed.rewrites)
      ? parsed.rewrites
          .filter(
            (item): item is { original: string; improved: string } =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as Record<string, unknown>).original === "string" &&
              typeof (item as Record<string, unknown>).improved === "string",
          )
          .slice(0, MAX_BULLETS)
      : [];

    return jsonResponse({ rewrites });
  } catch (e) {
    console.error("rewrite error:", e);
    return jsonResponse({ error: "Unexpected error" }, 500);
  }
});
