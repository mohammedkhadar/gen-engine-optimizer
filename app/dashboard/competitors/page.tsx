"use client";
import { useEffect, useState } from "react";
import { Card, Badge, Progress } from "@/components/ui";
import { Plus, X, Trophy, Loader2, Pencil, RotateCw, Play } from "lucide-react";
import { loadCachedAudit } from "@/lib/audit-cache";

const LS_KEY = "rankai:competitors";
const LS_ROWS = "rankai:competitor-rows";

type Rival = { name: string; domain: string };
type Target = { brand: string; domain: string; url: string };

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
  const [target, setTarget] = useState<Target | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // setup dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dBrand, setDBrand] = useState("");
  const [dDomain, setDDomain] = useState("");
  const [dUrl, setDUrl] = useState("");
  const [rivals, setRivals] = useState<Rival[]>([]);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [suggesting, setSuggesting] = useState(false);
  const [suggestedFor, setSuggestedFor] = useState("");

  const cleanDomain = (v: string) => v.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  // First visit: restore last comparison, else prefill from audit + open setup.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) ?? "null");
      if (saved?.brand && saved?.domain && Array.isArray(saved?.rivals) && saved.rivals.length) {
        setTarget({ brand: saved.brand, domain: saved.domain, url: saved.url ?? "" });
        try {
          const r = JSON.parse(localStorage.getItem(LS_ROWS) ?? "null");
          if (Array.isArray(r?.rows) && r.rows.length) {
            setRows(r.rows);
            return;
          }
        } catch {}
        return;
      }
    } catch {}
    loadCachedAudit().then((data) => {
      if (data?.url) {
        setDUrl((u) => u || data.url);
        try {
          const host = new URL(data.url).hostname.replace(/^www\./, "");
          setDDomain((d) => d || host);
        } catch {}
      }
    });
    setDialogOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistSetup = (t: Target, r: Rival[]) => {
    localStorage.setItem(LS_KEY, JSON.stringify({ ...t, rivals: r }));
  };

  const suggest = async () => {
    const key = `${dBrand}|${dDomain}|${dUrl}`;
    if (!dBrand.trim() || !dDomain.trim() || suggestedFor === key) return;
    setSuggestedFor(key);
    setSuggesting(true);
    try {
      const res = await fetch("/api/competitors/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: dBrand, domain: dDomain, url: dUrl.trim() || undefined }),
      });
      const data = await res.json();
      if (Array.isArray(data.competitors) && data.competitors.length) {
        setRivals((prev) => {
          const names = new Set(prev.map((r) => r.name.toLowerCase()));
          const fresh = data.competitors.filter((c: Rival) => c.name && !names.has(c.name.toLowerCase())).slice(0, 8 - prev.length);
          return [...prev, ...fresh];
        });
      }
    } finally {
      setSuggesting(false);
    }
  };

  // Auto-discover once brand+domain are typed in the dialog.
  useEffect(() => {
    if (dialogOpen && dBrand.trim() && dDomain.trim() && !rivals.length && !suggesting) {
      suggest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, dBrand, dDomain]);

  const compare = async (t: Target, r: Rival[]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: t.brand, domain: t.domain, competitors: r }),
      });
      const data = await res.json();
      setRows(data.comparison ?? []);
      try { localStorage.setItem(LS_ROWS, JSON.stringify({ rows: data.comparison ?? [] })); } catch {}
    } finally {
      setLoading(false);
    }
  };

  const saveAndCompare = () => {
    if (!dBrand.trim() || !dDomain.trim() || !rivals.length) return;
    const t = { brand: dBrand.trim(), domain: dDomain.trim(), url: dUrl.trim() };
    setTarget(t);
    persistSetup(t, rivals);
    setDialogOpen(false);
    compare(t, rivals);
  };

  const openEdit = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) ?? "null");
      if (saved) {
        setDBrand(saved.brand ?? "");
        setDDomain(saved.domain ?? "");
        setDUrl(saved.url ?? "");
        if (Array.isArray(saved.rivals)) setRivals(saved.rivals);
      } else if (target) {
        setDBrand(target.brand);
        setDDomain(target.domain);
        setDUrl(target.url);
      }
    } catch {}
    setDialogOpen(true);
  };

  const addRival = () => {
    const name = newName.trim();
    if (!name || rivals.some((r) => r.name.toLowerCase() === name.toLowerCase()) || rivals.length >= 8) return;
    setRivals([...rivals, { name, domain: cleanDomain(newDomain) }]);
    setNewName("");
    setNewDomain("");
  };

  const leader = rows.length ? rows.reduce((a, b) => (b.visibility > a.visibility ? b : a)) : null;
  const totalMentions = rows.reduce((a, r) => a + (r.mentions ?? 0), 0);
  const yourRow = target ? rows.find((r) => r.name.toLowerCase() === target.brand.toLowerCase()) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Competitor Intel</h1>
        <p className="text-sm text-slate-400">Name your rivals — compare AI share-of-voice side by side, same prompt battery for everyone.</p>
      </div>

      {target && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-semibold">{target.brand}</span>
              <span className="ml-2 text-sm text-slate-400">{target.domain}</span>
              <span className="ml-2 text-xs text-slate-500">vs {rows.length ? rows.length - (yourRow ? 1 : 0) : rivals.length} competitors</span>
            </div>
            <div className="flex gap-2">
              <button onClick={openEdit} disabled={loading}
                className="glass flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium hover:bg-white/10 disabled:opacity-50">
                <Pencil size={14} /> Edit competitors
              </button>
              <button onClick={() => {
                try {
                  const saved = JSON.parse(localStorage.getItem(LS_KEY) ?? "null");
                  const r = Array.isArray(saved?.rivals) ? saved.rivals : rivals;
                  compare(target, r);
                } catch { compare(target, rivals); }
              }} disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200 disabled:opacity-60">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />} {loading ? "Comparing…" : "Re-run comparison"}
              </button>
            </div>
          </div>
        </Card>
      )}

      {rows.length === 0 && !loading && (
        <Card className="text-center text-sm text-slate-400">
          No comparison yet — set up your competitors to run your first share-of-voice table.
        </Card>
      )}

      {/* Setup dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setDialogOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111726] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Who are you up against?</h2>
                <p className="text-xs text-slate-400">
                  {suggesting ? "Reading your site and finding rivals…" : rivals.length >= 2 ? `${rivals.length} competitors found — confirm, edit, or add more.` : "Enter your brand to auto-discover competitors, or add them manually."}
                </p>
              </div>
              <button onClick={() => setDialogOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><X size={16} /></button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <input value={dBrand} onChange={(e) => setDBrand(e.target.value)} placeholder="Your brand"
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-violet-500/60" />
              <input value={dDomain} onChange={(e) => setDDomain(e.target.value)} placeholder="yourdomain.com"
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-violet-500/60" />
            </div>
            {dUrl ? <p className="mt-2 text-xs text-slate-500">Discovering from <span className="text-slate-300">{dUrl}</span> (your last audit).</p> : null}
            {suggesting ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" /> Finding competitors…
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Competitors ({rivals.length}/8, min 1)</div>
                {rivals.map((r, i) => (
                  <div key={r.name + i} className="flex items-center gap-2">
                    <input value={r.name} onChange={(e) => setRivals(rivals.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                      placeholder="Company name"
                      className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-violet-500/60" />
                    <input value={r.domain} onChange={(e) => setRivals(rivals.map((x, j) => (j === i ? { ...x, domain: cleanDomain(e.target.value) } : x)))}
                      placeholder="website.com"
                      className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500/60" />
                    <button onClick={() => setRivals(rivals.filter((_, j) => j !== i))} title="Remove"
                      className="rounded-lg p-2 text-slate-500 hover:bg-white/10 hover:text-red-300"><X size={14} /></button>
                  </div>
                ))}
                {rivals.length < 8 && (
                  <div className="flex items-center gap-2">
                    <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addRival()}
                      placeholder="Company name"
                      className="flex-1 rounded-xl border border-dashed border-white/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-violet-500/60" />
                    <input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addRival()}
                      placeholder="website.com"
                      className="flex-1 rounded-xl border border-dashed border-white/20 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500/60" />
                    <button onClick={addRival} className="flex items-center gap-1 rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/5">
                      <Plus size={14} /> Add
                    </button>
                  </div>
                )}
                {!rivals.length && (
                  <button onClick={() => suggest()} disabled={!dBrand.trim() || !dDomain.trim()}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-sm hover:bg-white/5 disabled:opacity-40">
                    Discover competitors for my business
                  </button>
                )}
                <button onClick={saveAndCompare} disabled={!dBrand.trim() || !dDomain.trim() || !rivals.some((r) => r.name.trim()) || loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-slate-200 disabled:opacity-50">
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} Save & compare {rivals.filter((r) => r.name.trim()).length || ""} competitors
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {loading && rows.length === 0 && (
        <Card className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
          <Loader2 size={16} className="animate-spin" /> Comparing share-of-voice…
        </Card>
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
                      {target && c.name.toLowerCase() === target.brand.toLowerCase() && <Badge tone="blue">You</Badge>}
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
          {leader && target && leader.name.toLowerCase() !== target.brand.toLowerCase() && (
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
