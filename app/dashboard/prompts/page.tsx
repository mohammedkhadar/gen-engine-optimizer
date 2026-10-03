"use client";
import { useState } from "react";
import { Card, Badge, Progress } from "@/components/ui";
import { Loader2, Plus } from "lucide-react";

export default function PromptsPage() {
  const [brand, setBrand] = useState("Acme");
  const [domain, setDomain] = useState("acme.com");
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const res = await fetch("/api/visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand, domain }),
    });
    const data = await res.json();
    setTests(data.tests);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prompt Lab</h1>
        <p className="text-sm text-slate-400">Test the exact buyer prompts across 5 AI engines. See who gets cited.</p>
      </div>
      <Card>
        <div className="grid gap-2 sm:grid-cols-3">
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand name"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-violet-500/60" />
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="domain.com"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-violet-500/60" />
          <button onClick={run} disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-60">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {loading ? "Testing…" : "Run 5 prompt tests"}
          </button>
        </div>
      </Card>
      {tests.length === 0 && (
        <Card className="text-center text-sm text-slate-400">
          No tests yet — enter your brand and run your first prompt battery. Results show mention rate, position & sentiment per engine.
        </Card>
      )}
      <div className="grid gap-4">
        {tests.map((t) => (
          <Card key={t.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium">“{t.prompt}”</div>
              <div className="flex gap-2"><Badge tone="slate">{t.category}</Badge><Badge tone={t.visibility >= 60 ? "green" : "amber"}>{t.visibility}% visible</Badge></div>
            </div>
            <Progress value={t.visibility} className="mt-3" />
            <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {t.details.map((d: any) => (
                <div key={d.engine} className={`rounded-xl border p-3 text-center ${d.mentioned ? "border-emerald-500/30 bg-emerald-500/10" : "border-white/10 bg-black/30"}`}>
                  <div className="text-xs font-semibold">{d.engine}</div>
                  <div className="mt-1 text-lg">{d.mentioned ? "✓" : "✕"}</div>
                  <div className="text-[11px] text-slate-400">{d.mentioned ? `#${d.position} · ${d.sentiment}` : "not cited"}</div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
