"use client";
import { useState } from "react";
import Link from "next/link";
import { Nav, Footer, Card } from "@/components/ui";
import { Check, Loader2 } from "lucide-react";

const tiers = [
  { id: "STARTER", name: "Starter", price: "$29", desc: "For local businesses getting cited for the first time.", feats: ["1 domain", "50 prompt tests/mo", "Weekly AI visibility checks", "GEO audit + prioritized fixes", "Citation alerts"], cta: "Start free" },
  { id: "GROWTH", name: "Growth", price: "$79", desc: "For teams competing to be THE answer in their category.", feats: ["3 domains + 2 competitors each", "500 prompt tests/mo", "Daily checks across 7 engines", "Competitor intel + content optimizer", "Slack/email alerts + reports"], cta: "Start 14-day trial", hot: true },
  { id: "SCALE", name: "Scale / Agency", price: "$199", desc: "For agencies & multi-location brands.", feats: ["10 domains, unlimited seats", "Unlimited prompts + API", "White-label HTML reports", "llms.txt + schema automation", "Dedicated GEO strategist"], cta: "Talk to sales" },
];

export default function PricingPage() {
  const [busy, setBusy] = useState<string | null>(null);

  const checkout = async (plan: string) => {
    setBusy(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      }).then((r) => r.json());
      window.location.href = res.url;
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold">Pricing that pays for itself with one AI customer</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">Live Stripe checkout when keys are set — demo mode otherwise. Cancel anytime.</p>
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
              <button onClick={() => checkout(t.id)} disabled={!!busy}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ${t.hot ? "bg-white text-black" : "glass"}`}>
                {busy === t.id && <Loader2 size={14} className="animate-spin" />}{t.cta}
              </button>
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
