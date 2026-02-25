"use client";

import { useMemo, useState } from "react";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/70 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur">
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-neutral-900">
        {title}
      </h3>
      <div className="text-sm text-neutral-800">{children}</div>
    </section>
  );
}

function List({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <p className="text-neutral-500">—</p>;
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

export default function Page() {
  const [inputText, setInputText] = useState(
    "We keep getting customer complaints that onboarding is confusing. Support tickets are increasing, and we suspect users don’t understand the first key workflow. We want to reduce time-to-value and increase activation. We have limited engineering time and need an MVP in 2 weeks."
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<any>(null);

  const pretty = useMemo(
    () => (brief ? JSON.stringify(brief, null, 2) : ""),
    [brief]
  );

  const examples = [
    {
      label: "Onboarding confusion",
      text:
        "We keep getting customer complaints that onboarding is confusing. Support tickets are increasing, and we suspect users don’t understand the first key workflow. We want to reduce time-to-value and increase activation. We have limited engineering time and need an MVP in 2 weeks.",
    },
    {
      label: "Checkout drop-off",
      text:
        "Checkout completion has dropped 18% in the last month. Analytics shows a big drop at the payment step. Users complain about errors and unclear messaging. We need a 2-week MVP to reduce drop-off and increase conversion without rebuilding the whole checkout.",
    },
    {
      label: "Pricing confusion",
      text:
        "Users struggle to understand our pricing tiers and what features they get. Sales says prospects churn during trials because value isn’t clear. We want to improve conversion from trial to paid with an MVP in 2 weeks and minimal engineering effort.",
    },
  ];

  async function generate() {
    setLoading(true);
    setError(null);
    // keep last brief visible while generating

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.details || json?.error || "Request failed");

      setBrief(json.data);
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function copyJson() {
    if (!pretty) return;
    await navigator.clipboard.writeText(pretty);
  }

  function downloadJson() {
    if (!pretty) return;
    const blob = new Blob([pretty], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "discovery-brief.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearAll() {
    setInputText("");
    setBrief(null);
    setError(null);
  }

  const showOverloadRetry = Boolean(error?.toLowerCase().includes("overloaded"));

  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_700px_at_20%_-10%,rgba(99,102,241,0.35),transparent_60%),radial-gradient(900px_600px_at_95%_0%,rgba(236,72,153,0.28),transparent_55%),linear-gradient(to_bottom,rgba(255,255,255,1),rgba(250,250,255,1))]">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Hero */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/50 px-3 py-1 text-xs font-medium text-neutral-800 shadow-sm ring-1 ring-black/5 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" />
            Claude-powered • Discovery → MVP in minutes
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950">
            AI Discovery Copilot
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-neutral-700">
            Paste a product problem statement → generate a structured discovery brief
            (scope, metrics, risks, experiments, instrumentation).
          </p>
        </header>

        {/* Input */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/70 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur">
          <label className="text-sm font-medium text-neutral-900">
            Problem statement
          </label>

          <textarea
            className="mt-2 w-full rounded-xl border border-neutral-200 bg-white/80 p-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
            rows={6}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            placeholder="e.g. Users are dropping off during onboarding and support tickets are rising..."
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {examples.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => setInputText(ex.text)}
                disabled={loading}
                className="rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-white disabled:opacity-60"
              >
                {ex.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-neutral-600">{inputText.length} chars</span>
              <button
                type="button"
                onClick={clearAll}
                disabled={loading}
                className="rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-white disabled:opacity-60"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={generate}
              disabled={loading || !inputText.trim()}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-500 hover:to-fuchsia-500 disabled:opacity-60"
            >
              {loading ? "Generating brief…" : "Generate brief"}
            </button>

            <button
              onClick={copyJson}
              disabled={!brief}
              className="rounded-xl border border-neutral-200 bg-white/80 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-60"
            >
              Copy JSON
            </button>

            <button
              onClick={downloadJson}
              disabled={!brief}
              className="rounded-xl border border-neutral-200 bg-white/80 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-white disabled:opacity-60"
            >
              Download JSON
            </button>

            {error && (
              <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {error}
                {showOverloadRetry && (
                  <button
                    type="button"
                    onClick={generate}
                    className="ml-3 font-semibold underline underline-offset-2"
                  >
                    Try again
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Output */}
        {brief ? (
          <div className="space-y-4">
            <Card title="Problem summary">
              <p>{brief.problem_summary || "—"}</p>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card title="Target users">
                <List items={brief.target_users} />
              </Card>
              <Card title="Assumptions">
                <List items={brief.assumptions} />
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card title="Current pain signals">
                <List items={brief.current_pain_signals} />
              </Card>
              <Card title="Desired outcomes">
                <List items={brief.desired_outcomes} />
              </Card>
            </div>

            <Card title="MVP scope (2 weeks)">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="mb-2 font-medium text-neutral-900">Must-have</p>
                  <List items={brief.mvp_scope_2_weeks?.must_have} />
                </div>
                <div>
                  <p className="mb-2 font-medium text-neutral-900">Nice-to-have</p>
                  <List items={brief.mvp_scope_2_weeks?.nice_to_have} />
                </div>
                <div>
                  <p className="mb-2 font-medium text-neutral-900">Out of scope</p>
                  <List items={brief.mvp_scope_2_weeks?.out_of_scope} />
                </div>
              </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card title="Key user flows">
                <List items={brief.key_user_flows} />
              </Card>
              <Card title="Success metrics">
                <List items={brief.success_metrics} />
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card title="Risks & unknowns">
                <List items={brief.risks_and_unknowns} />
              </Card>
              <Card title="Experiment plan">
                <List items={brief.experiment_plan} />
              </Card>
            </div>

            <Card title="Instrumentation events">
              <List items={brief.instrumentation_events} />
            </Card>

            <details className="rounded-2xl border border-white/10 bg-white/70 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur">
              <summary className="cursor-pointer text-sm font-semibold text-neutral-900">
                View raw JSON
              </summary>
              <pre className="mt-3 overflow-auto rounded-xl bg-neutral-950/95 p-4 text-xs text-neutral-100">
                {pretty}
              </pre>
            </details>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white/70 p-10 text-center text-sm text-neutral-700 shadow-sm ring-1 ring-black/5 backdrop-blur">
            Generate a brief to see results here.
          </div>
        )}

        <footer className="mt-10 text-xs text-neutral-600">
          Tip: try “Checkout drop-off” then tweak the prompt to match a company you’re applying to.
        </footer>
      </div>
    </main>
  );
}
