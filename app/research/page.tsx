import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer, Card, Badge, SectionTitle } from "@/components/ui";
import { FlaskConical, BookOpen, FileText, ArrowUpRight } from "lucide-react";

const pillars = [
  {
    name: "Niche Ownership",
    weight: "15%",
    level: "Synthesized",
    tone: "amber" as const,
    finding: "No paper measures wedge-vs-generic directly, but the strategy follows from retrieval economics: a new brand can only be the defensible answer in a narrow buying situation (customer × geography × size × constraint). We score 0–4 detected dimensions.",
    source: "Practitioner playbooks + RAG retrieval literature",
    link: "https://arxiv.org/abs/2311.09735",
  },
  {
    name: "Evidence Base",
    weight: "25%",
    level: "Measured + synthesized",
    tone: "green" as const,
    finding: "Retrieval systems prefer self-contained, directly-answering chunks; the GEO paper's best methods all reward quotable blocks with question structure. Selection pages (pricing, vs, GDPR, integrations) mirror measured buyer-query clusters.",
    source: "GEO paper (ibid.) + RAG retrieval literature",
    link: "https://arxiv.org/abs/2311.09735",
  },
  {
    name: "Citable Facts",
    weight: "20%",
    level: "Measured",
    tone: "green" as const,
    finding: "Statistics Addition, Quotation Addition and Cite Sources were the top-performing GEO methods — up to ~30–40% visibility lift. Fluency/style rewrites barely moved results. Methodology disclosure and limitation honesty are our synthesis on top.",
    source: "GEO: Generative Engine Optimization — Aggarwal et al., Princeton, Nov 2023",
    link: "https://arxiv.org/abs/2311.09735",
  },
  {
    name: "Independent Corroboration",
    weight: "15%",
    level: "Documented",
    tone: "blue" as const,
    finding: "Google's rater guidelines define E-E-A-T — third-party validation beats self-claims — and Google explicitly warns against manufactured mentions. AI Overviews/Gemini inherit these signals.",
    source: "Google Search Quality Rater Guidelines + AI-optimization guide",
    link: "https://developers.google.com/search/docs/fundamentals/ai-optimization-guide",
  },
  {
    name: "Discoverability",
    weight: "25%",
    level: "Documented",
    tone: "blue" as const,
    finding: "Bot operators publish exactly what they need: allowed user-agents (GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot), renderable HTML, sitemaps, IndexNow. Google states its AI features rely on the normal search index — no special markup shortcuts.",
    source: "OpenAI bots docs · schema.org · Google AI-optimization guide",
    link: "https://developers.openai.com/api/docs/bots",
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
            <li>• The <b>grouping into six pillars and their weights</b> is CitedAI&apos;s synthesis — calibrated to published effect sizes, but our judgment, not gospel.</li>
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
