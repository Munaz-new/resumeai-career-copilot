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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonResponse({ error: "Server misconfigured" }, 500);

    const modeNote: Record<string, string> = {
      bullet: "Rewrite each input as a single ATS-friendly resume bullet point.",
      section: "Rewrite each input as a stronger resume section (Summary, Experience entry, or Project description). One improved version per input.",
      full: "Treat each input as part of a full resume rewrite. Make each line more impactful, ATS-friendly, and aligned with the job description.",
    };

    const roleLine = role
      ? `Target role: ${role}. Use vocabulary, action verbs and metrics that a recruiter for this exact role would expect.`
      : "";

    const systemPrompt = `You are a professional resume writer and ATS optimization expert.
${modeNote[safeMode]}
${roleLine}

Rules:
- Start with a strong action verb appropriate for the target role
- Include quantifiable results where possible (use realistic estimates if needed)
- Align with the job description keywords
- Keep each output concise (1-3 lines)
- Use professional language tuned to the target role

Return a JSON array of objects with "original" and "improved" fields.`;

    const userPrompt = `${role ? `Target Role: ${role}\n\n` : ""}Job Description:\n${jd}\n\nMode: ${safeMode}\nInputs to rewrite:\n${safeBullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Lovable-API-Key": LOVABLE_API_KEY,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_rewrites",
              description: "Return rewritten bullet points",
              parameters: {
                type: "object",
                properties: {
                  rewrites: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        original: { type: "string" },
                        improved: { type: "string" },
                      },
                      required: ["original", "improved"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["rewrites"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_rewrites" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return jsonResponse({ error: "Rate limit exceeded. Please try again later." }, 429);
      }
      if (response.status === 402) {
        return jsonResponse({ error: "AI credits exhausted. Please add funds." }, 402);
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return jsonResponse({ error: "AI rewrite is temporarily unavailable. Please try again." }, 502);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let rewrites = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      rewrites = parsed.rewrites || [];
    }

    return jsonResponse({ rewrites });
  } catch (e) {
    console.error("rewrite error:", e);
    return jsonResponse({ error: "Unexpected error" }, 500);
  }
});
