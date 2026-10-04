"use client";
import { useEffect, useState } from "react";
import { Card, Badge, Progress, ScoreRing } from "@/components/ui";
import { TrendingUp, Bell, Plus } from "lucide-react";
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

export default function DashboardOverview() {
  const [audit, setAudit] = useState<any>(null);
  useEffect(() => {
    const cached = localStorage.getItem("rankai:lastAudit");
    if (cached) { try { setAudit(JSON.parse(cached)); } catch {} }
  }, []);

  const radar = audit?.categories?.map((c: any) => ({ k: c.label.split(" ")[0], v: c.score })) ?? [
    { k: "Crawl", v: 72 }, { k: "Schema", v: 44 }, { k: "E-E-A-T", v: 68 },
    { k: "Answer", v: 81 }, { k: "Fresh", v: 60 }, { k: "Cite", v: 57 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Good morning, Acme 👋</h1>
          <p className="text-sm text-slate-400">Here&apos;s how AI engines see your business today.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/audit" className="glass rounded-lg px-4 py-2 text-sm font-medium hover:bg-white/10">+ New audit</Link>
          <Link href="/dashboard/prompts" className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200"><Plus size={14} className="inline" /> Track prompt</Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { l: "GEO Visibility Score", v: audit?.overall ?? 63, d: "+6 this week", tone: "violet" as const },
          { l: "AI Mentions (7d)", v: "1,284", d: "+12.4%", tone: "green" as const },
          { l: "Citation Rate", v: "61%", d: "+4 pts", tone: "blue" as const },
          { l: "Prompts Won", v: "38/52", d: "73% win rate", tone: "amber" as const },
        ].map((s) => (
          <Card key={s.l}>
            <div className="text-xs text-slate-400">{s.l}</div>
            <div className="mt-1 text-3xl font-extrabold">{s.v}</div>
            <div className="mt-1 text-xs text-emerald-300 flex items-center gap-1"><TrendingUp size={12} /> {s.d}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Visibility trend — you vs top competitor</h3>
            <Badge tone="green">Live</Badge>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visibilityTrend}>
                <XAxis dataKey="d" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ background: "#111726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="you" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="comp" stroke="#64748b" strokeWidth={2} strokeDasharray="6 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center">
          <h3 className="font-semibold self-start">Latest GEO score</h3>
          <div className="mt-3"><ScoreRing score={audit?.overall ?? 63} /></div>
          <div className="mt-2 w-full truncate text-sm text-slate-400" title={audit?.url ?? "acme.com"}>Grade {audit?.grade ?? "C"} · {audit?.url ?? "acme.com"}</div>
          <Link href="/dashboard/audit" className="mt-4 text-sm font-medium text-violet-300 hover:text-violet-200">View full audit →</Link>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold">Visibility by AI engine</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engineShare} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="engine" type="category" stroke="#cbd5e1" fontSize={12} width={90} />
                <Tooltip contentStyle={{ background: "#111726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                <Bar dataKey="you" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                <Bar dataKey="avg" fill="#334155" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold">GEO pillars radar</h3>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar}>
                <PolarGrid stroke="rgba(255,255,255,0.15)" />
                <PolarAngleAxis dataKey="k" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <ReRadar dataKey="v" stroke="#34d399" fill="#34d399" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2 font-semibold"><Bell size={16} /> Recent AI citations</div>
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
      </Card>

      <Card>
        <h3 className="font-semibold">Top recommended fixes</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {(audit?.topActions ?? [
            { title: "Add JSON-LD schema bundle", impact: "+12–18 pts", detail: "Organization + FAQPage + Article." },
            { title: "Add AI excerpt + FAQ block", impact: "+8–12 pts", detail: "40–60 word direct answer at top." },
            { title: "Publish /llms.txt + allow AI bots", impact: "+4–7 pts", detail: "Whitelist GPTBot, PerplexityBot." },
          ]).slice(0, 3).map((a: any, i: number) => (
            <div key={i} className="rounded-xl border border-white/10 bg-black/30 p-4">
              <Badge tone="violet">{a.impact}</Badge>
              <div className="mt-2 text-sm font-semibold">{a.title}</div>
              <div className="mt-1 text-xs text-slate-400">{a.detail}</div>
              <Link href="/dashboard/audit" className="mt-2 inline-block text-xs text-violet-300">Fix now →</Link>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
