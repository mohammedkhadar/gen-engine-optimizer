import Link from "next/link";
import { Nav, Footer, Card, Badge, SectionTitle, Progress } from "@/components/ui";
import { AuditWidget } from "@/components/AuditWidget";
import {
  Sparkles, Radar, MessagesSquare, Trophy, FileText, Quote,
  Check, ArrowRight, Zap, Globe, BrainCircuit, ShieldCheck,
} from "lucide-react";

const engines = ["ChatGPT", "Perplexity", "Gemini", "Claude", "Google AI Overviews", "Copilot", "Grok"];

const features = [
  { icon: Radar, title: "AI Visibility Tracking", desc: "Monitor if and where your brand is mentioned across 7 AI engines, daily. Position, sentiment, share-of-voice." },
  { icon: BrainCircuit, title: "GEO Site Audit", desc: "60+ checks: schema, E-E-A-T, answer-readiness, crawlability, citability. Real fetch + explainable score." },
  { icon: MessagesSquare, title: "Prompt Lab", desc: "Test the exact prompts your buyers ask. See which engines cite you — and which cite competitors." },
  { icon: Trophy, title: "Competitor Intel", desc: "Benchmark visibility vs rivals. Steal their citation sources, FAQs, and third-party mentions." },
  { icon: FileText, title: "Content Optimizer", desc: "Paste any page, get an AI-excerpt block, FAQ schema, and quotable stats rewritten for LLM citation." },
  { icon: Quote, title: "Citation Monitor", desc: "Get alerted when AI answers mention you — or stop mentioning you. Track every source URL." },
];

export default function LandingPage() {
  return (
    <div>
      <Nav />
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="grid-bg absolute inset-0" />
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-20 text-center">
          <Badge tone="violet"><Sparkles size={14} /> New: Google AI Overviews + Perplexity tracking</Badge>
          <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Get your business cited by <span className="gradient-text">AI answers</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-400">
            SEO won Google. <strong className="text-slate-200">GEO wins ChatGPT, Perplexity & Gemini.</strong> RankAI
            audits your site, tracks every AI mention, and tells you exactly what to fix to become the cited answer.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/dashboard" className="rounded-xl bg-white px-6 py-3 font-semibold text-black hover:bg-slate-200">
              Run free AI visibility audit →
            </Link>
            <Link href="/pricing" className="glass rounded-xl px-6 py-3 font-semibold hover:bg-white/10">
              View pricing
            </Link>
            <Link href="/video" className="rounded-xl px-6 py-3 font-semibold text-violet-300 hover:text-violet-200">
              ▶ Watch how it works (86s)
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="mr-1">We track:</span>
            {engines.map((e) => (
              <span key={e} className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{e}</span>
            ))}
          </div>
          {/* Interactive audit */}
          <div className="mx-auto mt-12 max-w-3xl text-left">
            <AuditWidget />
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Check size={16} className="text-emerald-400" /> No credit card</span>
            <span className="flex items-center gap-1.5"><Check size={16} className="text-emerald-400" /> 60-second audit</span>
            <span className="flex items-center gap-1.5"><Check size={16} className="text-emerald-400" /> 2,400+ brands tracked</span>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-10 text-center md:grid-cols-4">
          {[
            ["58%", "of product searches now end in an AI answer"],
            ["7", "AI engines tracked daily"],
            ["60+", "GEO audit signals per page"],
            ["3.2x", "avg. citation lift in 90 days"],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="text-3xl font-extrabold">{v}</div>
              <div className="mt-1 text-sm text-slate-400">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20">
        <SectionTitle kicker="Platform" title="Everything you need to win AI search" sub="One workspace to audit, track, benchmark and optimize your generative presence." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="hover:border-violet-500/40 transition-colors">
              <f.icon className="text-violet-300" size={24} />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <SectionTitle kicker="How it works" title="From invisible to cited in 3 steps" />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: Globe, step: "1. Audit", text: "Enter your URL. We fetch your page live and score 6 GEO pillars — schema, E-E-A-T, answer-readiness and more." },
              { icon: Radar, step: "2. Track", text: "Add brand + competitors + prompts. We simulate daily checks across 7 engines for mentions, position & sentiment." },
              { icon: Zap, step: "3. Optimize", text: "Follow ranked fixes, generate FAQ schema + AI excerpts, earn third-party mentions, watch citations climb." },
            ].map((s) => (
              <Card key={s.step}>
                <s.icon className="text-emerald-300" size={24} />
                <h3 className="mt-3 font-semibold">{s.step}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{s.text}</p>
              </Card>
            ))}
          </div>
          {/* Sample score */}
          <Card className="mx-auto mt-10 max-w-3xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm text-slate-400">Example: acme-dental.com</div>
                <div className="text-xl font-bold">GEO Score 73 <span className="text-sm font-medium text-slate-400">(Grade B)</span></div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-3"><span className="w-48 text-slate-400">Answer-Ready</span><Progress value={81} className="flex-1" /><span>81</span></div>
                  <div className="flex items-center gap-3"><span className="w-48 text-slate-400">Structured Data</span><Progress value={44} className="flex-1" /><span>44</span></div>
                  <div className="flex items-center gap-3"><span className="w-48 text-slate-400">E-E-A-T</span><Progress value={68} className="flex-1" /><span>68</span></div>
                </div>
              </div>
              <Link href="/dashboard/audit" className="rounded-xl bg-white px-5 py-2.5 text-center text-sm font-semibold text-black hover:bg-slate-200">
                Audit my site <ArrowRight size={14} className="inline" />
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* PRICING TEASER */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionTitle kicker="Pricing" title="Free forever. Every feature." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { name: "Starter", price: "Free", feats: ["1 domain", "50 prompts/mo", "Weekly visibility checks", "GEO audit + fixes"], cta: "Start free" },
            { name: "Growth", price: "Free", feats: ["3 domains", "500 prompts/mo", "Daily checks, 7 engines", "Competitor intel + alerts"], cta: "Start free", hot: true },
            { name: "Scale", price: "Free", feats: ["10 domains", "Unlimited prompts", "API + white-label reports", "llms.txt + schema tools"], cta: "Start free" },
          ].map((p) => (
            <Card key={p.name} className={p.hot ? "border-violet-500/50 ring-1 ring-violet-500/30" : ""}>
              {p.hot && <Badge tone="violet">Most popular</Badge>}
              <h3 className="mt-2 font-semibold">{p.name}</h3>
              <div className="mt-1 text-4xl font-extrabold">{p.price}</div>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {p.feats.map((f) => <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-400" />{f}</li>)}
              </ul>
              <Link href="/dashboard" className={`mt-5 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${p.hot ? "bg-white text-black hover:bg-slate-200" : "glass hover:bg-white/10"}`}>{p.cta}</Link>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-600/20 to-emerald-600/10 p-10 text-center">
          <ShieldCheck className="mx-auto text-emerald-300" size={32} />
          <h2 className="mt-3 text-3xl font-bold">Your buyers already ask AI. Are you the answer?</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-400">Run a free 60-second GEO audit and see exactly how ChatGPT, Perplexity and Gemini see your business.</p>
          <Link href="/dashboard/audit" className="mt-6 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-black hover:bg-slate-200">
            Audit my business now →
          </Link>
        </div>
      </section>
      <Footer />
    </div>
  );
}
