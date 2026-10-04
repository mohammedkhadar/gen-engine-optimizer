import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Footer, Card } from "@/components/ui";
import { CheckoutButton } from "@/components/CheckoutButton";
import { Check } from "lucide-react";

const tiers = [
  { id: "STARTER", name: "Starter", price: "$29", desc: "For local businesses getting cited for the first time. Audit → fix list → done.", feats: ["1 domain, full fix list", "50 prompt tests/mo proof-tracking", "Schema + FAQ + llms.txt generator", "Citation gained/lost alerts"], cta: "Fix my site" },
  { id: "GROWTH", name: "Growth", price: "$79", desc: "For teams competing to be THE answer. Steal competitors' citations, then watch yours climb.", feats: ["3 domains + competitor fix-gaps", "500 prompt tests/mo, 7 engines", "Content optimizer + citation playbook", "Weekly citation-lift report"], cta: "Start 14-day trial", hot: true },
  { id: "SCALE", name: "Scale / Agency", price: "$199", desc: "For agencies: run free audits as lead gen, sell the fix as a service.", feats: ["10 domains, unlimited seats", "White-label client reports", "Embeddable free-audit widget", "API + dedicated GEO strategist"], cta: "Talk to sales" },
];

export default function PricingPage() {
  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold">Dashboards don&apos;t get you cited. Fixes do.</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">Every plan includes the audit, the ranked fix list, and the generators — tracking just proves it worked. Cancel anytime.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {tiers.map((t) => (
            <Card key={t.id} className={t.hot ? "border-violet-500/50 ring-1 ring-violet-500/30" : ""}>
              <h3 className="font-semibold">{t.name}</h3>
              <div className="mt-1 text-4xl font-extrabold">{t.price}<span className="text-base font-medium text-slate-400">/mo</span></div>
              <p className="mt-1 text-sm text-slate-400">{t.desc}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {t.feats.map((f) => <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 text-emerald-400" />{f}</li>)}
              </ul>
              <CheckoutButton plan={t.id} label={t.cta} hot={t.hot} />
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
