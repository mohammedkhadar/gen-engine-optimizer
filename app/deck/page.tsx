"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Printer, StickyNote } from "lucide-react";

type Slide = {
  kicker: string;
  title: string;
  points: string[];
  visual: "chat-bad" | "chat-wrong" | "score" | "grid" | "fixes" | "chat-good" | "title" | "cta";
  notes: string;
};

const SLIDES: Slide[] = [
  {
    kicker: "RankAI · Generative Engine Optimization",
    title: "AI recommends your competitors. Here's exactly how to fix that.",
    points: ["58% of product searches end in an AI answer", "Only ~3 brands cited per answer", "Free 60-second audit — no signup"],
    visual: "title",
    notes: "Open with the shift: buyers stopped Googling. They ask AI — and the AI answers with a short list of brands, each with a clickable citation.",
  },
  {
    kicker: "Scene 1 · The shift",
    title: "Your buyers stopped Googling. They ask AI.",
    points: ['Buyer: "best CRM for a 10-person startup?"', "AI answers with a shortlist + cited sources", "If you're not cited, you were never in the room"],
    visual: "chat-bad",
    notes: "Your buyers stopped Googling. They ask AI — and the AI answers with a short list of brands, each with a clickable citation.",
  },
  {
    kicker: "Scene 2 · The problem",
    title: "If you're not cited, you don't exist.",
    points: ['Buyer asks about YOUR brand by name…', "…AI still recommends Competitor A and B", "SEO can't fix this — it's a GEO problem"],
    visual: "chat-wrong",
    notes: "A buyer asks about your brand by name — and the AI still recommends competitors, citing their pages. This is a Generative Engine Optimization problem.",
  },
  {
    kicker: "Scene 3 · Diagnose — GEO Audit",
    title: "One score, six pillars, every fix ranked.",
    points: ["Live fetch: schema, E-E-A-T, answer-readiness + 60 checks", "Per-engine citation likelihood (7 engines)", "Fixes ordered by point impact, deep-linked to generators"],
    visual: "score",
    notes: "RankAI fetches your site live and scores it the way AI engines do. One number, with every fix ranked by impact.",
  },
  {
    kicker: "Scene 4 · Track — Prompt Lab",
    title: "Test the exact prompts your buyers ask.",
    points: ["Pricing, comparison, reputation prompts", "Mention / position / sentiment per engine", "See who stole your spot — and where"],
    visual: "grid",
    notes: "Track the prompts that matter across seven AI engines. See who gets cited, who gets skipped, and which competitor stole your spot.",
  },
  {
    kicker: "Scene 5 · Fix — Content Optimizer",
    title: "Copy-paste assets that earn citations.",
    points: ["AI excerpt blocks + buyer-question FAQs", "JSON-LD schema bundle + Cloudflare injector", "llms.txt generator with one-click download"],
    visual: "fixes",
    notes: "Add the schema AI crawlers look for, lead every page with a quotable answer, publish llms.txt. Generated for you — copy, paste, done.",
  },
  {
    kicker: "Scene 6 · The outcome",
    title: "Same question. Now you're the answer.",
    points: ["Your pages become the cited sources", "Citation rate climbs week over week", "From invisible → mentioned → cited"],
    visual: "chat-good",
    notes: "Ninety days later the same buyer asks the same question — and your pages are the cited sources.",
  },
  {
    kicker: "RankAI GEO",
    title: "Dashboards don't get you cited. Fixes do.",
    points: ["Starter $29 · Growth $79 · Scale/Agency $199", "Free audit forever · white-label reports for agencies", "rankai.geo/dashboard/audit"],
    visual: "cta",
    notes: "Run your free AI visibility audit today, and see exactly how ChatGPT, Perplexity and Gemini see your business.",
  },
];

function Visual({ kind }: { kind: Slide["visual"] }) {
  const box = "mx-auto flex h-56 w-full max-w-md flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/50 p-6 text-center";
  switch (kind) {
    case "title":
      return <div className={box}><div className="text-7xl font-extrabold">R</div><div className="mt-2 text-xl font-bold">RankAI</div></div>;
    case "chat-bad":
      return <div className={box}><div className="mb-2 rounded-xl bg-violet-600/30 px-4 py-2 text-sm">“Best CRM for startups?”</div><div className="rounded-xl bg-white/5 px-4 py-2 text-sm text-slate-300">Try <b>Competitor A</b> — sources: g2.com · reddit.com</div></div>;
    case "chat-wrong":
      return <div className={box}><div className="mb-2 rounded-xl bg-violet-600/30 px-4 py-2 text-sm">“Is Acme reliable?”</div><div className="rounded-xl bg-white/5 px-4 py-2 text-sm text-slate-300">Most buyers pick <b>Competitor A</b> or <b>B</b></div></div>;
    case "score":
      return <div className={box}><div className="text-7xl font-extrabold text-emerald-300">73</div><div className="mt-1 text-xs uppercase tracking-widest text-slate-400">GEO score · Grade B</div></div>;
    case "grid":
      return <div className={box}><div className="grid grid-cols-3 gap-2 text-sm">{["ChatGPT ✓", "Perplexity ✓", "Gemini ✓", "Claude ✓", "Copilot ✕", "Llama ✕"].map((e) => <div key={e} className="rounded-lg bg-white/5 px-3 py-2">{e}</div>)}</div><div className="mt-2 text-xs text-slate-400">4 of 6 engines cite you</div></div>;
    case "fixes":
      return <div className={box}>{["JSON-LD schema bundle ✓", "AI excerpt + FAQ ✓", "llms.txt published ✓"].map((f) => <div key={f} className="mb-2 rounded-lg bg-emerald-500/10 px-4 py-2 text-sm">{f}</div>)}</div>;
    case "chat-good":
      return <div className={box}><div className="mb-2 rounded-xl bg-violet-600/30 px-4 py-2 text-sm">“Best CRM for startups?”</div><div className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm text-slate-200">Top pick: <b>Acme</b> — sources: acme.com/pricing</div></div>;
    case "cta":
      return <div className={box}><div className="text-2xl font-bold">Get my fix list — free →</div><div className="mt-2 text-sm text-slate-400">rankai.geo/dashboard/audit</div></div>;
  }
}

export default function DeckPage() {
  const [i, setI] = useState(0);
  const [notes, setNotes] = useState(true);
  const n = SLIDES.length;
  const go = useCallback((d: number) => setI((v) => Math.min(n - 1, Math.max(0, v + d))), [n]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go]);

  const s = SLIDES[i];

  return (
    <div className="flex min-h-screen flex-col bg-[#05070D]">
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <header className="no-print mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 font-bold">R</div>
          <span className="font-bold">RankAI <span className="text-xs font-medium text-slate-400">pitch deck · {i + 1}/{n}</span></span>
        </Link>
        <div className="flex gap-2">
          <button onClick={() => setNotes(!notes)} className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5">
            <StickyNote size={13} /> {notes ? "Hide notes" : "Show notes"}
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5">
            <Printer size={13} /> Print / PDF
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-6">
        <div key={i} className="grid aspect-video w-full grid-cols-2 items-center gap-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0B0F1A] px-12">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">{s.kicker}</div>
            <h1 className="mt-3 text-4xl font-extrabold leading-tight">{s.title}</h1>
            <ul className="mt-5 space-y-2.5">
              {s.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-[15px] text-slate-300">
                  <span className="mt-0.5 text-emerald-400">▸</span>{p}
                </li>
              ))}
            </ul>
            {notes && <p className="mt-6 border-l-2 border-amber-400/50 pl-3 text-[13px] italic text-slate-400">🎙 {s.notes}</p>}
          </div>
          <Visual kind={s.visual} />
        </div>
        <div className="no-print mt-3 flex items-center justify-between">
          <button onClick={() => go(-1)} disabled={i === 0} className="flex items-center gap-1 rounded-lg border border-white/15 px-4 py-2 text-sm disabled:opacity-30">
            <ChevronLeft size={16} /> Prev
          </button>
          <div className="flex gap-1.5">
            {SLIDES.map((_, j) => (
              <button key={j} onClick={() => setI(j)} className={`h-2 w-6 rounded-full ${j === i ? "bg-white" : "bg-white/15"}`} />
            ))}
          </div>
          <button onClick={() => go(1)} disabled={i === n - 1} className="flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-30">
            Next <ChevronRight size={16} />
          </button>
        </div>
        <p className="no-print mt-2 text-center text-xs text-slate-500">Arrow keys / space to navigate · print to PDF for a shareable deck</p>
      </div>
    </div>
  );
}
