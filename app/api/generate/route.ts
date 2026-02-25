import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function extractJsonObject(text: string): string | null {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) return null;
  return cleaned.slice(start, end + 1);
}

/**
 * Guarantees a stable response shape for the UI even if the model returns partial JSON.
 */
function normalizeBrief(data: any) {
  return {
    problem_summary: data?.problem_summary ?? "",
    assumptions: Array.isArray(data?.assumptions) ? data.assumptions : [],
    target_users: Array.isArray(data?.target_users) ? data.target_users : [],
    current_pain_signals: Array.isArray(data?.current_pain_signals)
      ? data.current_pain_signals
      : [],
    desired_outcomes: Array.isArray(data?.desired_outcomes)
      ? data.desired_outcomes
      : [],
    mvp_scope_2_weeks: {
      must_have: Array.isArray(data?.mvp_scope_2_weeks?.must_have)
        ? data.mvp_scope_2_weeks.must_have
        : [],
      nice_to_have: Array.isArray(data?.mvp_scope_2_weeks?.nice_to_have)
        ? data.mvp_scope_2_weeks.nice_to_have
        : [],
      out_of_scope: Array.isArray(data?.mvp_scope_2_weeks?.out_of_scope)
        ? data.mvp_scope_2_weeks.out_of_scope
        : [],
    },
    key_user_flows: Array.isArray(data?.key_user_flows)
      ? data.key_user_flows
      : [],
    success_metrics: Array.isArray(data?.success_metrics)
      ? data.success_metrics
      : [],
    risks_and_unknowns: Array.isArray(data?.risks_and_unknowns)
      ? data.risks_and_unknowns
      : [],
    experiment_plan: Array.isArray(data?.experiment_plan)
      ? data.experiment_plan
      : [],
    instrumentation_events: Array.isArray(data?.instrumentation_events)
      ? data.instrumentation_events
      : [],
  };
}function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 4): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;

      const status =
        err?.status ??
        err?.response?.status ??
        err?.error?.status;

      // Anthropic overloaded error
      const msg = String(err?.message || "");
      const isOverloaded = status === 529 || msg.includes("529") || msg.includes("overloaded");

      if (!isOverloaded || i === attempts - 1) throw err;

      // backoff: 500ms, 1000ms, 2000ms...
      await sleep(500 * Math.pow(2, i));
    }
  }
  throw lastErr;
}


async function repairJson(badJson: string): Promise<string> {
  const fixer = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2200,
    temperature: 0,
    system:
      "You fix invalid JSON. Return ONLY corrected strict JSON (no markdown, no explanation).",
    messages: [
      {
        role: "user",
        content:
          "Fix this to strict valid JSON. Do not change meaning. Return JSON only:\n\n" +
          badJson,
      },
    ],
  });

  const fixedRaw = fixer.content
    .filter((c) => c.type === "text")
    .map((c: any) => c.text)
    .join("")
    .trim();

  return extractJsonObject(fixedRaw) ?? fixedRaw;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const inputText = body?.inputText;

    if (!inputText || typeof inputText !== "string") {
      return Response.json({ error: "Missing inputText" }, { status: 400 });
    }

    const system = `You are an AI Product Discovery Copilot.

Return JSON only. No markdown. No code fences.

Rules:
- Output must be STRICT valid JSON.
- Use double quotes for all keys and string values.
- No trailing commas.
- Escape any quotes inside strings.
- Do not include comments.
- Output must include ALL keys in the schema. If unsure, use empty arrays or empty strings.

Return ONLY valid JSON following this schema:
{
  "problem_summary": string,
  "assumptions": string[],
  "target_users": string[],
  "current_pain_signals": string[],
  "desired_outcomes": string[],
  "mvp_scope_2_weeks": {
    "must_have": string[],
    "nice_to_have": string[],
    "out_of_scope": string[]
  },
  "key_user_flows": string[],
  "success_metrics": string[],
  "risks_and_unknowns": string[],
  "experiment_plan": string[],
  "instrumentation_events": string[]
}`;

    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2200,
      temperature: 0,
      system,
      messages: [{ role: "user", content: inputText }],
    });

    const raw = msg.content
      .filter((c) => c.type === "text")
      .map((c: any) => c.text)
      .join("")
      .trim();

    const jsonCandidate = extractJsonObject(raw);

    if (!jsonCandidate) {
      return Response.json(
        {
          error: "Claude returned no JSON object",
          details: raw.slice(0, 800),
        },
        { status: 500 }
      );
    }

    // First parse attempt
    try {
      const parsed = JSON.parse(jsonCandidate);
      return Response.json({ data: normalizeBrief(parsed) }, { status: 200 });
    } catch (e1: any) {
      // Repair pass
      const repaired = await repairJson(jsonCandidate);

      try {
        const parsed = JSON.parse(repaired);
        return Response.json({ data: normalizeBrief(parsed) }, { status: 200 });
      } catch (e2: any) {
        return Response.json(
          {
            error: "Claude returned invalid JSON (even after repair)",
            details: e2?.message || "Parse failed",
            snippet: repaired.slice(0, 800),
          },
          { status: 500 }
        );
      }
    }
  } catch (err: any) {
    const details =
      err?.message || err?.error?.message || JSON.stringify(err, null, 2);

    return Response.json(
      { error: "Claude request failed", details },
      { status: 500 }
    );
  }
}
