"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loadCachedAudit, saveCachedAudit, fixLink } from "@/lib/audit-cache";
import { Card, Badge, Progress, ScoreRing } from "@/components/ui";
import { Loader2, Search, CheckCircle2, XCircle, Wrench } from "lucide-react";

export default function AuditPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-400">Loading audit…</div>}>
      <AuditInner />
    </Suspense>
  );
}

function AuditInner() {
  const params = useSearchParams();
  const [url, setUrl] = useState(params.get("url") ?? "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const run = async (target?: string) => {
    const u = (target ?? url).trim();
    if (!u) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Audit failed");
      setResult(data);
      saveCachedAudit(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const q = params.get("url");
    if (q) { setUrl(q); run(q); return; }
    // ?fresh=1 (New audit button): blank form, skip cached restore.
    if (params.get("fresh")) { setUrl(""); return; }
    // Restore this account's last result: browser cache, then server history.
    loadCachedAudit().then((data) => {
      if (data?.url) { setResult(data); setUrl(data.url); return; }
      fetch("/api/history")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          const latest = d?.audits?.[0];
          if (latest?.url) {
            setResult(latest);
            setUrl(latest.url);
            saveCachedAudit(latest);
          }
        })
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">GEO Site Audit</h1>
        <p className="text-sm text-slate-400">Live fetch + 60+ generative-readiness checks across 6 pillars.</p>
      </div>

      <Card>
        <form onSubmit={(e) => { e.preventDefault(); run(); }} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourbusiness.com"
              className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-3 text-sm outline-none focus:border-violet-500/60" />
          </div>
          <button type="submit" disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold disabled:opacity-60">
            {loading && <Loader2 size={16} className="animate-spin" />} {loading ? "Crawling…" : "Run GEO audit"}
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
      </Card>

      {result && (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="flex flex-col items-center gap-5 overflow-hidden sm:flex-row">
              <div className="shrink-0"><ScoreRing score={result.overall} /></div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="text-sm text-slate-400">Overall GEO score</div>
                <div className="text-xl font-bold">Grade {result.grade}</div>
                <div className="mt-0.5 truncate text-sm font-medium text-slate-300" title={result.url}>
                  {(() => { try { return new URL(result.url).hostname; } catch { return result.url; } })()}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {result.fetched ? `Fetched live · ${result.meta.wordCount.toLocaleString()} words · ${result.meta.loadMs}ms` : "Estimated (fetch blocked)"}
                </div>
                {result.meta.title && <div className="mt-1 truncate text-xs text-slate-400">“{result.meta.title}”</div>}
              </div>
            </Card>
            <Card className="lg:col-span-2">
              <h3 className="font-semibold">Likelihood of being cited by each AI engine</h3>
              <div className="mt-3 space-y-2.5">
                {result.aiReadiness.map((a: any) => (
                  <div key={a.engine}>
                    <div className="flex justify-between text-sm"><span>{a.engine}</span><span className="text-slate-400">{a.likelihood}%</span></div>
                    <Progress value={a.likelihood} className="mt-1" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {result.categories.map((c: any) => (
              <Card key={c.key}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{c.label}</h3>
                  <Badge tone={c.score >= 75 ? "green" : c.score >= 55 ? "amber" : "red"}>{c.score}/100</Badge>
                </div>
                <Progress value={c.score} className="mt-2" />
                <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
                  {c.findings.map((f: string, i: number) => <li key={i} className="flex gap-2"><span className="text-slate-500">•</span>{f}</li>)}
                </ul>
                <div className="mt-3 rounded-xl bg-black/30 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-300"><Wrench size={13} /> FIXES</div>
                  <ul className="mt-1.5 space-y-1 text-xs text-slate-400">
                    {c.fixes.map((f: string, i: number) => <li key={i}>→ {f}</li>)}
                  </ul>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <h3 className="font-semibold">Citation checklist</h3>
              <div className="mt-3 space-y-2">
                {result.citations.map((c: any) => (
                  <div key={c.type} className="flex items-start gap-3 rounded-xl bg-white/[0.03] p-3 text-sm">
                    {c.found ? <CheckCircle2 size={18} className="mt-0.5 text-emerald-400" /> : <XCircle size={18} className="mt-0.5 text-red-400" />}
                    <div><div className="font-medium">{c.type}</div><div className="text-xs text-slate-400">{c.detail}</div></div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h3 className="font-semibold">Top 5 priority actions</h3>
              <div className="mt-3 space-y-2">
                {result.topActions.map((a: any, i: number) => {
                  const f = fixLink(a);
                  return (
                  <div key={i} className="rounded-xl border border-white/10 bg-black/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{i + 1}. {a.title}</span>
                      <Badge tone="violet">{a.impact}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{a.detail}</p>
                    <p className="mt-1 text-[11px] text-slate-500">Effort: {a.effort}</p>
                    <Link href={f.link} className="mt-2 inline-block text-xs font-medium text-emerald-300 hover:text-emerald-200">
                      {f.linkLabel}
                    </Link>
                  </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
