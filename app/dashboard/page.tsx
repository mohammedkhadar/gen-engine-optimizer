"use client";
import { useEffect, useState } from "react";
import { Card, Badge, Progress, ScoreRing } from "@/components/ui";
import { TrendingUp, Bell, Plus, Zap } from "lucide-react";
import { loadCachedAudit, saveCachedAudit } from "@/lib/audit-cache";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, Radar as ReRadar,
} from "recharts";

const visibilityTrend = [
  { d: "Sep 26", you: 42, comp: 55 }, { d: "Sep 28", you: 48, comp: 57 },
  { d: "Sep 30", you: 51, comp: 60 }, { d: "Oct 1", you: 57, comp: 62 },
  { d: "Oct 2", you: 63, comp: 64 },
];
const engineShare = [
  { engine: "ChatGPT", you: 68, avg: 55 }, { engine: "Perplexity", you: 74, avg: 60 },
  { engine: "Gemini", you: 59, avg: 58 }, { engine: "Claude", you: 52, avg: 50 },
  { engine: "Copilot", you: 61, avg: 53 },
];

const PILLAR_INFO: Record<string, { full: string; what: string; fix: string }> = {
  "Crawlability": { full: "Crawlability & Technical (15%)", what: "Can AI bots reach, load and render your pages? Title tags, meta descriptions, speed, and AI crawlers allowed in robots.txt.", fix: "Allow GPTBot/PerplexityBot/ClaudeBot, keep TTFB < 800ms, no JS-only content." },
  "Structured": { full: "Structured Data & Machine Readability (20%)", what: "Machine-readable facts via JSON-LD (Organization, FAQPage, Article). Lets engines parse with certainty instead of guessing.", fix: "Add the schema bundle — highest-leverage fix (+12–18 pts)." },
  "E-E-A-T": { full: "E-E-A-T & Trust (20%)", what: "Do engines trust you? Author bylines with credentials, publish dates, stats, and links to primary sources.", fix: "Add bios, dates, and 3+ outbound citations per key page." },
  "Answer-Ready": { full: "Answer-Ready Content (25%)", what: "Is your content shaped like quotable answers? 40–60 word TL;DR up top, question-style headings, bullets and tables.", fix: "Lead every page with a direct answer block + 5 Q&A headings." },
  "Freshness": { full: "Freshness & Reputation (10%)", what: "Do you look current and talked-about? Update dates, fresh edits, reviews and third-party mentions (Reddit, G2).", fix: "Refresh top pages every 60–90 days with a changelog note." },
  "Citability": { full: "Citability & Evidence (10%)", what: "Is there anything shaped like a quotable fact? Stats, one-liners, tables and expert quotes answers can lift with a link.", fix: "One stat + source link per section, quotable takeaways." },
};

const SHORT: Record<string, string> = {
  "Crawlability & Technical": "Crawlability",
  "Structured Data & Machine Readability": "Structured",
  "E-E-A-T & Trust": "E-E-A-T",
  "Answer-Ready Content": "Answer-Ready",
  "Freshness & Reputation": "Freshness",
  "Citability & Evidence": "Citability",
};

const DEFAULT_CATS = [
  { label: "Crawlability & Technical", score: 72 },
  { label: "Structured Data & Machine Readability", score: 44 },
  { label: "E-E-A-T & Trust", score: 68 },
  { label: "Answer-Ready Content", score: 81 },
  { label: "Freshness & Reputation", score: 60 },
  { label: "Citability & Evidence", score: 57 },
];

export default function DashboardOverview() {
  const [audit, setAudit] = useState<any>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // Per-account restore: browser cache first, then this account's server history.
    loadCachedAudit().then((data) => {
      if (data?.url) { setAudit(data); setReady(true); return; }
      fetch("/api/history")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const latest = d?.audits?.[0];
          if (latest?.url) {
            setAudit(latest);
            saveCachedAudit(latest);
          }
        })
        .catch(() => {})
        .finally(() => setReady(true));
    });
  }, []);

  const cats: { label: string; score: number }[] = audit?.categories ?? DEFAULT_CATS;
  const radar = cats.map((c: any) => ({ k: SHORT[c.label] ?? c.label.split(" ")[0], v: c.score }));
  const hasData = !!audit;

  // Custom tooltip: hovering any radar vertex explains that pillar —
  // name, score, what it measures, and its top fix.
  const PillarTip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const k: string = payload[0]?.payload?.k ?? "";
    const v: number = payload[0]?.payload?.v ?? 0;
    const info = PILLAR_INFO[k];
    if (!info) return null;
    return (
      <div className="w-64 rounded-xl border border-violet-500/40 bg-[#141B2E]/95 p-3 shadow-2xl">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-violet-200">{info.full}</div>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-white">{v}</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-300">{info.what}</p>
        <p className="mt-1 text-[11px] text-slate-300"><span className="font-semibold text-emerald-300">Fix: </span>{info.fix}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {!ready ? (
        <div className="animate-pulse space-y-6" aria-label="Loading dashboard">
          <div className="h-8 w-64 rounded-lg bg-white/10" />
          <div className="grid gap-4 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-white/5 border border-white/10" />)}
          </div>
          <div className="h-72 rounded-2xl bg-white/5 border border-white/10" />
          <div className="grid gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => <div key={i} className="h-72 rounded-2xl bg-white/5 border border-white/10" />)}
          </div>
        </div>
      ) : (
      <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">AI visibility overview</h1>
          <p className="text-sm text-slate-400">Here&apos;s how AI engines see your business today.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/audit?fresh=1" className="glass rounded-lg px-4 py-2 text-sm font-medium hover:bg-white/10">+ New audit</Link>
          <Link href="/dashboard/prompts" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200"><Plus size={14} className="inline" /> Track prompt</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {(() => {
          const score = audit?.overall;
          const tone = score == null ? "none" : score >= 75 ? "emerald" : score >= 55 ? "amber" : "red";
          const text = tone === "emerald" ? "text-emerald-300" : tone === "amber" ? "text-amber-300" : tone === "red" ? "text-red-300" : "text-slate-500";
          const ring = tone === "emerald" ? "border-emerald-500/40 bg-emerald-500/[0.07]" : tone === "amber" ? "border-amber-500/40 bg-amber-500/[0.07]" : tone === "red" ? "border-red-500/40 bg-red-500/[0.07]" : "";
          const items = [
            { l: "GEO Visibility Score", v: score ?? "—", d: hasData ? "+6 this week" : "No audit yet", hot: true },
            { l: "AI Mentions (7d)", v: hasData ? "1,284" : "—", d: hasData ? "+12.4%" : "No data yet" },
            { l: "Citation Rate", v: hasData ? "61%" : "—", d: hasData ? "+4 pts" : "No data yet" },
            { l: "Prompts Won", v: hasData ? "38/52" : "—", d: hasData ? "73% win rate" : "No data yet" },
          ];
          return items.map((s) => (
            <Card key={s.l} className={s.hot ? ring : ""}>
              <div className="text-xs text-slate-400">{s.l}</div>
              <div className={`mt-1 text-3xl font-extrabold ${s.hot ? text : ""}`}>{s.v}</div>
              <div className="mt-1 text-xs text-emerald-300 flex items-center gap-1">{hasData && <TrendingUp size={12} />} {s.d}</div>
            </Card>
          ));
        })()}
      </div>

      {!hasData && (
        <Card className="border-violet-500/40 bg-gradient-to-br from-violet-600/15 to-emerald-600/10 text-center">
          <h3 className="text-lg font-bold">No audits yet — get your first GEO score in 60 seconds</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">Run an audit to unlock your visibility score, pillar radar, trends and prioritized fixes.</p>
          <Link href="/dashboard/audit?fresh=1" className="mt-4 inline-block rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-slate-200">
            Run my first audit →
          </Link>
        </Card>
      )}

      {hasData && (
      <Card className="border-emerald-500/30 ring-1 ring-emerald-500/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 font-semibold"><Zap size={17} className="text-emerald-300" /> Top recommended fixes</h3>
          <Link href="/dashboard/audit" className="text-xs font-medium text-violet-300 hover:text-violet-200">Full audit →</Link>
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {(audit!.topActions).slice(0, 3).map((a: any, i: number) => (
            <div key={i} className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-black">{i + 1}</span>
                <Badge tone="violet">{a.impact}</Badge>
              </div>
              <div className="mt-2 text-sm font-semibold">{a.title}</div>
              <div className="mt-1 text-xs text-slate-400">{a.detail}</div>
              <Link href="/dashboard/audit" className="mt-2 inline-block text-xs font-medium text-emerald-300 hover:text-emerald-200">Fix now →</Link>
            </div>
          ))}
        </div>
      </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Visibility trend — you vs top competitor</h3>
            <Badge tone="green">Live</Badge>
          </div>
          <div className="mt-4 h-64">
            {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visibilityTrend}>
                <XAxis dataKey="d" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ background: "#111726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="you" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="comp" stroke="#64748b" strokeWidth={2} strokeDasharray="6 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No tracking data yet — run an audit to start building your trend.</div>
            )}
          </div>
        </Card>
        <Card className="flex flex-col items-center text-center">
          <h3 className="font-semibold self-start text-left">Latest GEO score</h3>
          <div className="mt-3 flex flex-1 flex-col items-center justify-center">
          {hasData ? (
          <>
          <div className="mt-3"><ScoreRing score={audit.overall} /></div>
          <div className="mt-2 w-full truncate text-sm text-slate-400" title={audit.url}>Grade {audit.grade} · {audit.url}</div>
          <Link href={`/dashboard/audit?url=${encodeURIComponent(audit.url)}`} className="mt-4 text-sm font-medium text-violet-300 hover:text-violet-200">View full audit →</Link>
          </>
          ) : (
          <>
          <div className="text-5xl font-extrabold text-slate-600">—</div>
          <div className="mt-2 text-sm text-slate-500">No score yet</div>
          <Link href="/dashboard/audit?fresh=1" className="mt-4 text-sm font-medium text-violet-300 hover:text-violet-200">Run first audit →</Link>
          </>
          )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold">Visibility by AI engine</h3>
          <div className="mt-4 h-64">
            {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engineShare} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="engine" type="category" stroke="#cbd5e1" fontSize={12} width={90} />
                <Tooltip contentStyle={{ background: "#111726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Bar dataKey="you" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                <Bar dataKey="avg" fill="#334155" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">No engine data yet.</div>
            )}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">GEO pillars radar</h3>
            <span className="text-[11px] text-slate-500">hover the chart for meaning</span>
          </div>
          <div className="mt-2 h-64">
            {hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar}>
                <PolarGrid stroke="rgba(255,255,255,0.15)" />
                <PolarAngleAxis dataKey="k" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <ReRadar dataKey="v" stroke="#34d399" fill="#34d399" fillOpacity={0.25} />
                <Tooltip content={<PillarTip />} />
              </RadarChart>
            </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">Your pillar shape appears after your first audit.</div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 font-semibold"><Bell size={16} /> Recent AI citations</div>
        {hasData ? (
        <div className="mt-3 space-y-2 text-sm">
          {[
            ["Perplexity cited your pricing page for “acme vs competitor pricing”", "2h ago", "green"],
            ["ChatGPT mentioned Competitor A instead of you for “best CRM for startups”", "6h ago", "amber"],
            ["Google AI Overview quoted your FAQ: “How much does implementation cost?”", "1d ago", "green"],
          ].map(([t, when, tone]) => (
            <div key={t as string} className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-4 py-3">
              <span className="text-slate-300">{t}</span>
              <Badge tone={tone as any}>{when as string}</Badge>
            </div>
          ))}
        </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No citations tracked yet — they appear here once prompt tracking runs.</p>
        )}
      </Card>
      </>
      )}
    </div>
  );
}
