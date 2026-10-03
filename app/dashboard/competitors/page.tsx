"use client";
import { useState } from "react";
import { Card, Badge, Progress } from "@/components/ui";

export default function CompetitorsPage() {
  const [brand, setBrand] = useState("Acme");
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => {
    const res = await fetch("/api/visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand, domain: `${brand.toLowerCase()}.com` }),
    });
    const data = await res.json();
    setRows(data.competitors);
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Competitor Intel</h1>
        <p className="text-sm text-slate-400">Benchmark AI share-of-voice against rivals.</p>
      </div>
      <Card>
        <div className="flex gap-2">
          <input value={brand} onChange={(e) => setBrand(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-violet-500/60" placeholder="Your brand" />
          <button onClick={load} className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black">Compare</button>
        </div>
      </Card>
      {rows.length === 0 && <Card className="text-sm text-slate-400">Click Compare to generate a live benchmark.</Card>}
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((c) => (
          <Card key={c.name}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{c.name}</h3>
              <Badge tone={c.visibility >= 65 ? "green" : c.visibility >= 55 ? "amber" : "red"}>{c.visibility}% visible</Badge>
            </div>
            <Progress value={c.visibility} className="mt-2" />
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-lg bg-black/30 p-2"><div className="font-bold">{c.mentions.toLocaleString()}</div><div className="text-[11px] text-slate-500">mentions</div></div>
              <div className="rounded-lg bg-black/30 p-2"><div className="font-bold">{c.sentiment}%</div><div className="text-[11px] text-slate-500">positive</div></div>
              <div className="rounded-lg bg-black/30 p-2"><div className="font-bold">{c.trend[c.trend.length-1] - c.trend[0] > 0 ? "+" : ""}{c.trend[c.trend.length-1] - c.trend[0]}</div><div className="text-[11px] text-slate-500">trend pts</div></div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Steal play: target their top cited pages — comparison tables, G2 reviews, Reddit threads — and publish a better, fresher version with FAQ schema.</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
