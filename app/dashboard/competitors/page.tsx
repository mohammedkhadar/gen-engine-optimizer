"use client";
import { useEffect, useState } from "react";
import { Card, Badge, Progress } from "@/components/ui";
import { Plus, X, Trophy, Loader2 } from "lucide-react";

const LS_KEY = "rankai:competitors";

function Spark({ data, w = 90, h = 26 }: { data: number[]; w?: number; h?: number }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 3 - ((v - min) / span) * (h - 6)}`).join(" ");
  const up = data[data.length - 1] >= data[0];
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline points={pts} fill="none" stroke={up ? "#34d399" : "#f87171"} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export default function CompetitorsPage() {
  const [brand, setBrand] = useState("Acme");
  const [domain, setDomain] = useState("acme.com");
  const [rivals, setRivals] = useState<{ name: string; domain: string }[]>([]);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [editName, setEditName] = useState<string | null>(null);
  const [editDomain, setEditDomain] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) {
        const p = JSON.parse(saved);
        if (Array.isArray(p.rivals)) {
          // migrate legacy string[] entries + backfill placeholder domains,
          // dropping the old demo placeholders entirely
          const PLACEHOLDERS: Record<string, string> = {
            "competitor a": "competitor-a.com",
            "competitor b": "competitor-b.com",
          };
          const migrated = p.rivals.map((r: any) => {
            const entry = typeof r === "string" ? { name: r, domain: "" } : { name: r.name ?? "", domain: r.domain ?? "" };
            if (!entry.domain && PLACEHOLDERS[entry.name.toLowerCase()]) {
              entry.domain = PLACEHOLDERS[entry.name.toLowerCase()];
            }
            return entry;
          }).filter((r: any) => r.name && !(r.name === "Competitor A" || r.name === "Competitor B"));
          setRivals(migrated);
          if (JSON.stringify(migrated) !== JSON.stringify(p.rivals)) {
            localStorage.setItem(LS_KEY, JSON.stringify({ rivals: migrated, brand: p.brand, domain: p.domain }));
          }
        }
        if (p.brand) setBrand(p.brand);
        if (p.domain) setDomain(p.domain);
      }
    } catch {}
  }, []);

  const persist = (r: { name: string; domain: string }[], b = brand, d = domain) => {
    localStorage.setItem(LS_KEY, JSON.stringify({ rivals: r, brand: b, domain: d }));
  };

  const cleanDomain = (v: string) => v.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  const addRival = () => {
    const name = newName.trim();
    if (!name || rivals.some((r) => r.name.toLowerCase() === name.toLowerCase()) || rivals.length >= 8) return;
    const next = [...rivals, { name, domain: cleanDomain(newDomain) }];
    setRivals(next); setNewName(""); setNewDomain(""); persist(next);
  };

  const removeRival = (name: string) => {
    const next = rivals.filter((r) => r.name !== name);
    setRivals(next); persist(next);
  };

  const saveDomain = (name: string) => {
    const next = rivals.map((r) => (r.name === name ? { ...r, domain: cleanDomain(editDomain) } : r));
    setRivals(next); persist(next); setEditName(null); setEditDomain("");
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, domain, competitors: rivals }),
      });
      const data = await res.json();
      setRows(data.comparison ?? []);
      persist(rivals, brand, domain);
    } finally {
      setLoading(false);
    }
  };

  const leader = rows.length ? rows.reduce((a, b) => (b.visibility > a.visibility ? b : a)) : null;
  const totalMentions = rows.reduce((a, r) => a + (r.mentions ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Competitor Intel</h1>
        <p className="text-sm text-slate-400">Name your rivals — compare AI share-of-voice side by side, same prompt battery for everyone.</p>
      </div>

      <Card>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Your brand"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-violet-500/60" />
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourdomain.com"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-violet-500/60" />
          <button onClick={load} disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-60">
            {loading && <Loader2 size={15} className="animate-spin" />} {loading ? "Comparing…" : "Compare"}
          </button>
        </div>
        <div className="mt-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Competitors ({rivals.length}/8)</div>
          <div className="flex flex-wrap gap-2">
            {rivals.map((r) => (
              <span key={r.name} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs">
                <span className="font-medium">{r.name}</span>
                {r.domain ? (
                  <span className="text-slate-500">{r.domain}</span>
                ) : editName === r.name ? (
                  <input
                    autoFocus
                    value={editDomain}
                    onChange={(e) => setEditDomain(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveDomain(r.name); if (e.key === "Escape") setEditName(null); }}
                    onBlur={() => { if (editDomain.trim()) saveDomain(r.name); else setEditName(null); }}
                    placeholder="website.com"
                    className="w-28 rounded-md border border-violet-500/50 bg-black/60 px-1.5 py-0.5 text-xs outline-none"
                  />
                ) : (
                  <button onClick={() => { setEditName(r.name); setEditDomain(""); }} className="text-violet-300/80 hover:text-violet-200">
                    + add site
                  </button>
                )}
                <button onClick={() => removeRival(r.name)} className="text-slate-500 hover:text-red-300"><X size={13} /></button>
              </span>
            ))}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addRival()}
              placeholder="Company name"
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-violet-500/60" />
            <input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addRival()}
              placeholder="Website (competitor.com)"
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-violet-500/60" />
            <button onClick={addRival} className="flex items-center justify-center gap-1 rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
              <Plus size={14} /> Add
            </button>
          </div>
        </div>
      </Card>

      {rows.length === 0 && (
        <Card className="text-sm text-slate-400">Add your rivals above, then hit Compare — one table, same methodology for every brand.</Card>
      )}

      {rows.length > 0 && (
        <Card className="overflow-x-auto">
          <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
            <Trophy size={15} className="text-amber-300" />
            Share of AI mentions: {rows.map((r) => `${r.name} ${totalMentions ? Math.round((r.mentions / totalMentions) * 100) : 0}%`).join(" · ")}
          </div>
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-3">Brand</th>
                <th className="py-2 pr-3">Visibility</th>
                <th className="py-2 pr-3 text-right">Mentions</th>
                <th className="py-2 pr-3 text-right">Positive</th>
                <th className="py-2 text-right">Trend</th>
              </tr>
            </thead>
            <tbody>
              {[...rows].sort((a, b) => b.visibility - a.visibility).map((c, i) => (
                <tr key={c.name} className={`border-b border-white/5 ${i === 0 ? "bg-violet-500/[0.07]" : ""}`}>
                  <td className="py-3 pr-3">
                    <span className="font-semibold">{c.name}</span>
                    <span className="ml-2 text-[11px] text-slate-500">{c.domain}</span>
                    <div className="mt-1 flex gap-1.5">
                      {i === 0 && <Badge tone="violet">Leader</Badge>}
                      {c.name.toLowerCase() === brand.toLowerCase() && <Badge tone="blue">You</Badge>}
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <Progress value={c.visibility} className="w-28" />
                      <span className="font-bold">{c.visibility}%</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-right tabular-nums">{c.mentions.toLocaleString()}</td>
                  <td className="py-3 pr-3 text-right tabular-nums">{c.sentiment}%</td>
                  <td className="py-3 text-right"><Spark data={c.trend} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {leader && leader.name.toLowerCase() !== brand.toLowerCase() && (
            <p className="mt-3 text-xs text-slate-400">
              Steal play: <b className="text-slate-200">{leader.name}</b> leads at {leader.visibility}%. Target their most-cited page types —
              comparison tables, review profiles, Reddit threads — and publish fresher versions with FAQ schema.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
