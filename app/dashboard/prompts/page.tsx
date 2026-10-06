"use client";
import { useEffect, useState } from "react";
import { Card, Badge, Progress } from "@/components/ui";
import { Loader2, Plus, Pencil, X, Play, RotateCw } from "lucide-react";
import { loadCachedAudit } from "@/lib/audit-cache";

const LS_RESULTS = "rankai:prompt-results";
const LS_TARGET = "rankai:prompt-target";

type Target = { brand: string; domain: string; url: string };

function resultsKey(t: Target) {
  return `${t.brand.toLowerCase()}|${t.domain.toLowerCase()}`;
}

function loadResults(t: Target): { tests: any[]; source: any } | null {
  try {
    const all = JSON.parse(localStorage.getItem(LS_RESULTS) ?? "{}");
    return all[resultsKey(t)] ?? null;
  } catch {
    return null;
  }
}

function saveResults(t: Target, tests: any[], source: any) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_RESULTS) ?? "{}");
    all[resultsKey(t)] = { tests, source, at: Date.now() };
    localStorage.setItem(LS_RESULTS, JSON.stringify(all));
    localStorage.setItem(LS_TARGET, JSON.stringify(t));
  } catch {}
}

function loadTarget(): Target | null {
  try {
    const t = JSON.parse(localStorage.getItem(LS_TARGET) ?? "null");
    if (t?.brand && t?.domain) return { brand: t.brand, domain: t.domain, url: t.url ?? "" };
    return null;
  } catch {
    return null;
  }
}

export default function PromptsPage() {
  const [target, setTarget] = useState<Target | null>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [source, setSource] = useState<"custom" | "llm" | "business" | "generic" | null>(null);
  const [loading, setLoading] = useState(false);
  // setup dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dBrand, setDBrand] = useState("");
  const [dDomain, setDDomain] = useState("");
  const [dUrl, setDUrl] = useState("");
  const [draft, setDraft] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestSource, setSuggestSource] = useState<string | null>(null);
  const [suggestedFor, setSuggestedFor] = useState("");

  // First visit: restore last target + results, else open the setup dialog.
  useEffect(() => {
    const t = loadTarget();
    if (t) {
      setTarget(t);
      const saved = loadResults(t);
      if (saved) {
        setTests(saved.tests);
        setSource(saved.source);
        return;
      }
    }
    // No previous run: prefill URL from audit, open setup.
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

  const suggest = async (forBrand: string, forDomain: string, forUrl: string) => {
    const key = `${forBrand}|${forDomain}|${forUrl}`;
    if (!forBrand.trim() || !forDomain.trim() || suggestedFor === key) return;
    setSuggestedFor(key);
    setSuggesting(true);
    try {
      const res = await fetch("/api/prompts/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: forBrand, domain: forDomain, url: forUrl.trim() || undefined }),
      });
      const data = await res.json();
      setDraft(data.prompts ?? []);
      setSuggestSource(data.source ?? null);
    } finally {
      setSuggesting(false);
    }
  };

  // Auto-suggest once brand+domain are typed in the dialog.
  useEffect(() => {
    if (dialogOpen && dBrand.trim() && dDomain.trim() && !draft.length && !suggesting) {
      suggest(dBrand, dDomain, dUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen, dBrand, dDomain]);

  const run = async (t: Target, prompts?: string[]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: t.brand, domain: t.domain, url: t.url || undefined, prompts }),
      });
      const data = await res.json();
      setTests(data.tests);
      setSource(data.batterySource ?? null);
      saveResults(t, data.tests, data.batterySource ?? null);
    } finally {
      setLoading(false);
    }
  };

  const saveAndRun = () => {
    const clean = draft.map((p) => p.trim()).filter(Boolean).slice(0, 10);
    if (!clean.length || !dBrand.trim() || !dDomain.trim()) return;
    const t = { brand: dBrand.trim(), domain: dDomain.trim(), url: dUrl.trim() };
    setTarget(t);
    setDialogOpen(false);
    run(t, clean);
  };

  const openEdit = () => {
    if (target) {
      setDBrand(target.brand);
      setDDomain(target.domain);
      setDUrl(target.url);
      const saved = loadResults(target);
      void saved;
    }
    // Seed draft from current results' prompts for editing.
    if (tests.length) setDraft(tests.map((t) => t.prompt));
    setSuggestSource(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prompt Lab</h1>
        <p className="text-sm text-slate-400">Your buyer prompts, tested across AI engines. See who gets cited.</p>
      </div>

      {target && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-semibold">{target.brand}</span>
              <span className="ml-2 text-sm text-slate-400">{target.domain}</span>
              {source && (
                <span className="ml-2 text-xs text-slate-500">
                  {source === "custom" ? `${tests.length} custom prompts` : source === "llm" ? "AI-written prompts" : source === "business" ? "Site-based prompts" : "Generic prompts"}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={openEdit} disabled={loading}
                className="glass flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium hover:bg-white/10 disabled:opacity-50">
                <Pencil size={14} /> Edit prompts
              </button>
              <button onClick={() => run(target)} disabled={loading}
                className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200 disabled:opacity-60">
                {loading ? <Loader2 size={14} className="animate-spin" /> : <RotateCw size={14} />} {loading ? "Testing…" : "Re-run tests"}
              </button>
            </div>
          </div>
        </Card>
      )}

      {tests.length === 0 && !loading && (
        <Card className="text-center text-sm text-slate-400">
          No tests yet — set up your prompts to run your first battery. Results show mention rate, position & sentiment per engine.
        </Card>
      )}

      {/* Setup dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setDialogOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#111726] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Your buyer prompts</h2>
                <p className="text-xs text-slate-400">
                  {suggesting ? "Reading your site and drafting suggestions…" : suggestSource ? `Suggested ${suggestSource === "llm" ? "by AI " : ""}from your site — edit freely.` : "Enter your brand to get suggestions, or write your own."}
                </p>
              </div>
              <button onClick={() => setDialogOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><X size={16} /></button>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <input value={dBrand} onChange={(e) => setDBrand(e.target.value)} placeholder="Brand name"
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-violet-500/60" />
              <input value={dDomain} onChange={(e) => setDDomain(e.target.value)} placeholder="domain.com"
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-violet-500/60" />
            </div>
            {dUrl ? <p className="mt-2 text-xs text-slate-500">Tailoring to <span className="text-slate-300">{dUrl}</span> (from your last audit).</p> : null}
            {suggesting ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" /> Drafting prompts{dDomain ? ` from ${dDomain}` : ""}…
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {draft.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-2.5 w-6 shrink-0 text-center text-xs font-bold text-slate-500">{i + 1}</span>
                    <textarea value={p} rows={2} onChange={(e) => setDraft(draft.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder="e.g. What is the best CRM for a 10-person startup?"
                      className="flex-1 rounded-xl border border-white/10 bg-black/40 p-2.5 text-sm outline-none focus:border-violet-500/60" />
                    <button onClick={() => setDraft(draft.filter((_, j) => j !== i))} title="Remove"
                      className="mt-2 rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-red-300"><X size={14} /></button>
                  </div>
                ))}
                {!draft.length && !suggesting && (
                  <button onClick={() => suggest(dBrand, dDomain, dUrl)} disabled={!dBrand.trim() || !dDomain.trim()}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-sm hover:bg-white/5 disabled:opacity-40">
                    Suggest 5 prompts for my business
                  </button>
                )}
                {!!draft.length && draft.length < 10 && (
                  <button onClick={() => setDraft([...draft, ""])}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5">
                    <Plus size={14} /> Add another prompt ({draft.length}/10)
                  </button>
                )}
                <button onClick={saveAndRun} disabled={!draft.some((p) => p.trim()) || !dBrand.trim() || !dDomain.trim() || loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-slate-200 disabled:opacity-50">
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />} Save & run {draft.filter((p) => p.trim()).length} prompt tests
                </button>
              </div>
            )}
          </div>
        </div>
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
