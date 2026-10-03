import Link from "next/link";
import { Nav, Footer, Card, Badge } from "@/components/ui";
import { Check } from "lucide-react";

const tiers = [
  { name: "Starter", desc: "For local businesses getting cited for the first time.", feats: ["1 domain", "50 prompt tests/mo", "Weekly AI visibility checks", "GEO audit + prioritized fixes", "Citation alerts"] },
  { name: "Growth", desc: "For teams competing to be THE answer in their category.", feats: ["3 domains + 2 competitors each", "500 prompt tests/mo", "Daily checks across 7 engines", "Competitor intel + content optimizer", "Reports + llms.txt generator"], hot: true },
  { name: "Scale", desc: "For agencies & multi-location brands.", feats: ["10 domains", "Unlimited prompts", "White-label HTML reports", "Schema bundle + Worker snippet", "API access"] },
];

export default function PricingPage() {
  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <Badge tone="green">100% free · no credit card · no catch</Badge>
          <h1 className="mt-4 text-4xl font-extrabold">Every plan is free.</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">RankAI is a free product. Pick the tier that fits your size — all features included, just different limits.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {tiers.map((t) => (
            <Card key={t.name} className={t.hot ? "border-violet-500/50 ring-1 ring-violet-500/30" : ""}>
              {t.hot && <Badge tone="violet">Most popular</Badge>}
              <h3 className="mt-2 font-semibold">{t.name}</h3>
              <div className="mt-1 text-4xl font-extrabold">Free</div>
              <p className="mt-1 text-sm text-slate-400">{t.desc}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {t.feats.map((f) => <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-400" />{f}</li>)}
              </ul>
              <Link href="/dashboard" className={`mt-5 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold ${t.hot ? "bg-white text-black hover:bg-slate-200" : "glass hover:bg-white/10"}`}>
                Get started
              </Link>
            </Card>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          API: <Link href="/api/health" className="underline">/api/health</Link> ·
          Reports: <code>/api/reports?format=html&amp;brand=Acme&amp;url=https://example.com</code> ·
          llms.txt: <Link href="/llms.txt" className="underline">/llms.txt</Link>
        </p>
      </div>
      <Footer />
    </div>
  );
}
