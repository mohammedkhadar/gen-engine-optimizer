"use client";
import Link from "next/link";

const pillars = [
  ["Answer-ready · 25%", "Quotable TL;DR blocks, question-style headings, bullets & tables."],
  ["Structured data · 20%", "JSON-LD schema bundle crawlers parse with certainty."],
  ["E-E-A-T · 20%", "Authors, dates, stats, sources — trust signals models weigh."],
  ["Crawlability · 15%", "Fast pages AI bots can reach and render."],
  ["Freshness · 10%", "Visible dates, regular updates, review volume."],
  ["Citability · 10%", "One-liners, numbers and tables answers can lift with a link."],
];

const steps = [
  ["1 · Audit (60s)", "Enter any URL. Live fetch scores 6 GEO pillars, 60+ checks — every fix ranked by point impact."],
  ["2 · Track (daily)", "Buyer prompts tested across 7 AI engines. Mentions, position, sentiment, cited URLs — vs competitors."],
  ["3 · Fix (copy-paste)", "AI excerpts, FAQ blocks, JSON-LD schema, llms.txt — generated, ready to ship. Watch citations climb."],
];

export default function OnePager() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          a { text-decoration: none !important; color: inherit !important; }
        }
      `}</style>

      <div className="no-print mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold text-slate-600">← RankAI</Link>
        <button onClick={() => window.print()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
          Print / Save PDF
        </button>
      </div>

      <div className="mx-auto max-w-4xl px-6 pb-12">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 font-bold text-white">R</div>
              <span className="text-2xl font-extrabold">RankAI</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">GEO PLATFORM</span>
            </div>
            <p className="mt-2 max-w-xl text-lg font-medium leading-snug">
              AI recommends your competitors. We tell you exactly how to fix that.
            </p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>rankai.geo</div>
            <div className="mt-1">Free 60-second audit · No signup</div>
          </div>
        </div>

        {/* Problem */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            ["58%", "of product searches now end in an AI answer, not a results page."],
            ["~3", "brands get mentioned per answer. Everyone else is invisible."],
            ["0", "sales calls needed — run the audit yourself, get the fix list."],
          ].map(([v, l]) => (
            <div key={l} className="rounded-xl bg-slate-50 p-4 text-center">
              <div className="text-3xl font-extrabold">{v}</div>
              <div className="mt-1 text-xs text-slate-600">{l}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <h2 className="mt-6 text-sm font-bold uppercase tracking-widest text-slate-500">How it works</h2>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {steps.map(([t, d]) => (
            <div key={t} className="rounded-xl border border-slate-200 p-4">
              <div className="font-bold">{t}</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{d}</p>
            </div>
          ))}
        </div>

        {/* Pillars */}
        <h2 className="mt-6 text-sm font-bold uppercase tracking-widest text-slate-500">What gets scored — 6 GEO pillars</h2>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {pillars.map(([t, d]) => (
            <div key={t} className="rounded-xl bg-slate-50 p-3">
              <div className="text-sm font-bold">{t}</div>
              <p className="mt-0.5 text-xs text-slate-600">{d}</p>
            </div>
          ))}
        </div>

        {/* Proof + pricing */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-sm font-bold uppercase tracking-widest text-slate-500">Proof it worked</div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Daily prompt batteries across ChatGPT, Perplexity, Gemini, Claude, Copilot, Grok + open models.
              Mentions, position, sentiment and cited URLs — you vs competitors, with gained/lost alerts.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="text-sm font-bold uppercase tracking-widest text-slate-500">Pricing</div>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              <b>Starter $29</b> · 1 domain, full fix list. <b>Growth $79</b> · 3 domains, competitor gaps, lift reports.{" "}
              <b>Scale $199</b> · agencies: white-label reports + lead-gen audit widget. Free audit forever.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-900 p-5 text-white">
          <div>
            <div className="font-bold">Dashboards don&apos;t get you cited. Fixes do.</div>
            <div className="mt-0.5 text-xs text-slate-300">Run the free audit → get your ranked fix list → become the cited answer.</div>
          </div>
          <div className="text-right text-sm font-bold">rankai.geo/dashboard/audit</div>
        </div>
      </div>
    </div>
  );
}
