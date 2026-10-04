import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer, Card, Badge, SectionTitle } from "@/components/ui";
import { FlaskConical, BookOpen, FileText, ArrowUpRight } from "lucide-react";

const pillars = [
  {
    name: "Citability & Evidence",
    weight: "10% + feeds Answer-ready",
    level: "Measured",
    tone: "green" as const,
    finding: "Statistics Addition, Quotation Addition and Cite Sources were the top-performing GEO methods — up to ~30–40% visibility lift. Fluency/style rewrites barely moved results.",
    source: "GEO: Generative Engine Optimization — Aggarwal et al., Princeton, Nov 2023",
    link: "https://arxiv.org/abs/2311.09735",
  },
  {
    name: "Answer-ready content",
    weight: "25%",
    level: "Measured + synthesized",
    tone: "green" as const,
    finding: "Retrieval systems prefer self-contained, directly-answering chunks; the GEO paper's best methods all reward directly quotable blocks. Our 25% weight reflects this combined evidence.",
    source: "GEO paper (ibid.) + RAG retrieval literature",
    link: "https://arxiv.org/abs/2311.09735",
  },
  {
    name: "E-E-A-T & Trust",
    weight: "20%",
    level: "Documented",
    tone: "blue" as const,
    finding: "Google's 170-page rater guidelines define Experience, Expertise, Authoritativeness, Trust — authorship, dates, sourcing. AI Overviews/Gemini inherit these signals.",
    source: "Google Search Quality Rater Guidelines",
    link: "https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf",
  },
  {
    name: "Crawlability & Technical",
    weight: "15%",
    level: "Documented",
    tone: "blue" as const,
    finding: "Bot operators publish exactly what they need: allowed user-agents (GPTBot, PerplexityBot, ClaudeBot), renderable HTML, fast responses. Observable requirements, not theory.",
    source: "OpenAI GPTBot docs · PerplexityBot & ClaudeBot crawling policies · robots.txt conventions",
    link: "https://platform.openai.com/docs/gptbot",
  },
  {
    name: "Structured data",
    weight: "20%",
    level: "Documented + observed",
    tone: "blue" as const,
    finding: "schema.org vocabulary + Google's structured-data docs define machine-readable facts; citation engines observably extract schema-marked content cleanly (esp. FAQPage).",
    source: "schema.org · Google Search Central structured data docs",
    link: "https://schema.org",
  },
  {
    name: "Freshness & Reputation",
    weight: "10%",
    level: "Synthesized",
    tone: "amber" as const,
    finding: "Recency signals matter to RAG retrievers and training-cutoff-sensitive models; third-party mentions (reviews, forums) dominate LLM training corpora. Smallest weight = weakest direct evidence.",
    source: "RAG recency literature + corpus composition studies",
    link: "https://arxiv.org/abs/2311.09735",
  },
];

export default function ResearchPage() {
  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="text-center">
          <Badge tone="violet"><FlaskConical size={14} /> Methodology, published</Badge>
          <h1 className="mt-4 text-4xl font-extrabold">What our 6 pillars are built on</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            No black boxes. Below: the peer-reviewed paper, the official guidelines, and the primary docs behind
            every pillar — plus an honest label for what&apos;s measured, what&apos;s documented, and what&apos;s our judgment.
          </p>
        </div>

        <Card className="mt-10">
          <div className="flex items-start gap-3">
            <BookOpen className="mt-1 shrink-0 text-emerald-300" size={20} />
            <div className="text-sm">
              <div className="font-semibold">The founding paper: GEO (Aggarwal et al., 2023)</div>
              <p className="mt-1 text-slate-400">
                Princeton researchers coined &ldquo;Generative Engine Optimization&rdquo; and benchmarked 9 methods on
                Perplexity.ai and GPT-4 with search across 10,000 queries. Statistics, quotations, and cited sources won
                decisively (up to ~40% gains); style tweaks did almost nothing. Our Citability pillar and weighting
                philosophy come straight from these results.
              </p>
              <a href="https://arxiv.org/abs/2311.09735" target="_blank" rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-violet-300 hover:text-violet-200">
                arxiv.org/abs/2311.09735 <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </Card>

        <div className="mt-6 space-y-4">
          {pillars.map((p) => (
            <Card key={p.name}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{p.name}</h3>
                <div className="flex gap-2">
                  <Badge tone="slate">{p.weight}</Badge>
                  <Badge tone={p.tone}>{p.level}</Badge>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-300">{p.finding}</p>
              <a href={p.link} target="_blank" rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200">
                <FileText size={13} /> {p.source} <ArrowUpRight size={13} />
              </a>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-amber-500/30">
          <h3 className="font-semibold text-amber-200">Honest caveats</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
            <li>• The <b>grouping into six pillars and their weights</b> is RankAI&apos;s synthesis — calibrated to published effect sizes, but our judgment, not gospel.</li>
            <li>• The 2023 GEO paper tested Perplexity + GPT-4-era systems; engines evolve, and we update weights as new research lands.</li>
            <li>• Per-engine citation percentages are modeled estimates; Prompt Lab answers are measured. We label which is which everywhere.</li>
          </ul>
        </Card>

        <div className="mt-8 text-center">
          <SectionTitle kicker="See it applied" title="Run the audit built on this research" />
          <Link href="/dashboard/audit" className="mt-4 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-black hover:bg-slate-200">
            Get my fix list — free →
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}
