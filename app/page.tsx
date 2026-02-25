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
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold tracking-wide text-neutral-800">
        {title}
      </h3>
      <div className="text-sm text-neutral-700">{children}</div>
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
    setBrief(null);

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

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            AI Discovery Copilot
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Paste a product problem statement → get a structured discovery brief you can reuse in docs,
            tickets, or a portfolio case study.
          </p>
        </header>

        <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <label className="text-sm font-medium text-neutral-800">
            Problem statement
          </label>

          <textarea
            className="mt-2 w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-800 outline-none focus:ring-2 focus:ring-neutral-300 disabled:opacity-60"
            rows={6}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {examples.map((ex) => (
              <button
                key={ex.label}
                type="button"
                onClick={() => setInputText(ex.text)}
                disabled={loading}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
              >
                {ex.label}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-neutral-500">{inputText.length} chars</span>
              <button
                type="button"
                onClick={clearAll}
                disabled={loading}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={generate}
              disabled={loading || !inputText.trim()}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? "Generating brief…" : "Generate brief"}
            </button>

            <button
              onClick={copyJson}
              disabled={!brief}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 disabled:opacity-60"
            >
              Copy JSON
            </button>

            <button
              onClick={downloadJson}
              disabled={!brief}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-800 disabled:opacity-60"
            >
              Download JSON
            </button>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </div>

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
                  <p className="mb-2 font-medium text-neutral-800">Must-have</p>
                  <List items={brief.mvp_scope_2_weeks?.must_have} />
                </div>
                <div>
                  <p className="mb-2 font-medium text-neutral-800">Nice-to-have</p>
                  <List items={brief.mvp_scope_2_weeks?.nice_to_have} />
                </div>
                <div>
                  <p className="mb-2 font-medium text-neutral-800">Out of scope</p>
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

            <details className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-neutral-800">
                View raw JSON
              </summary>
              <pre className="mt-3 overflow-auto rounded-xl bg-neutral-50 p-4 text-xs text-neutral-800">
                {pretty}
              </pre>
            </details>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-sm text-neutral-600">
            Generate a brief to see results here.
          </div>
        )}
      </div>
    </main>
  );
}
