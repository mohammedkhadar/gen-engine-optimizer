"use client";
import { useEffect, useState } from "react";
import { Card, Badge, Progress } from "@/components/ui";
import { Loader2, Plus, Pencil, X, Play } from "lucide-react";

const LS_PROMPTS = "rankai:promptset";

type SavedSet = { brand: string; domain: string; url: string; prompts: string[] };

function loadSaved(brand: string, domain: string): SavedSet | null {
  try {
    const all = JSON.parse(localStorage.getItem(LS_PROMPTS) ?? "{}");
    return all[`${brand.toLowerCase()}|${domain.toLowerCase()}`] ?? null;
  } catch {
    return null;
  }
}

function saveSet(s: SavedSet) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_PROMPTS) ?? "{}");
    all[`${s.brand.toLowerCase()}|${s.domain.toLowerCase()}`] = s;
    localStorage.setItem(LS_PROMPTS, JSON.stringify(all));
  } catch {}
}

export default function PromptsPage() {
  const [brand, setBrand] = useState("Acme");
  const [domain, setDomain] = useState("acme.com");
  const [url, setUrl] = useState("");
  const [tests, setTests] = useState<any[]>([]);
  const [source, setSource] = useState<"custom" | "llm" | "business" | "generic" | null>(null);
  const [loading, setLoading] = useState(false);
  // setup dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestSource, setSuggestSource] = useState<string | null>(null);

  const run = async (prompts?: string[]) => {
    setLoading(true);
    const res = await fetch("/api/visibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand, domain, url: url.trim() || undefined, prompts }),
    });
    const data = await res.json();
    setTests(data.tests);
    setSource(data.batterySource ?? null);
    setLoading(false);
  };

  const openDialog = async (forBrand = brand, forDomain = domain, forUrl = url) => {
    const saved = loadSaved(forBrand, forDomain);
    if (saved?.prompts?.length) {
      setDraft(saved.prompts);
      setDialogOpen(true);
      return;
    }
    // First visit for this brand: suggest a battery, then let them edit.
    setDraft([]);
    setSuggestSource(null);
    setDialogOpen(true);
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

  const saveAndRun = () => {
    const clean = draft.map((p) => p.trim()).filter(Boolean).slice(0, 10);
    if (!clean.length) return;
    saveSet({ brand, domain, url, prompts: clean });
    setDialogOpen(false);
    run(clean);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prompt Lab</h1>
        <p className="text-sm text-slate-400">Your buyer prompts, tested across AI engines. See who gets cited.</p>
      </div>
      <Card>
        <div className="grid gap-2 sm:grid-cols-4">
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand name"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-violet-500/60" />
          <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="domain.com"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none focus:border-violet-500/60" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Site URL for tailored prompts (optional)"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500/60" />
          <button onClick={() => openDialog()} disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-60">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Pencil size={15} />} {loading ? "Testing…" : "Set up prompts"}
          </button>
        </div>
        {source && (
          <p className="mt-2 text-xs text-slate-500">
            {source === "custom"
              ? `${tests.length} custom prompt${tests.length === 1 ? "" : "s"} — edit anytime below.`
              : source === "llm"
                ? "Prompts below were written by AI from this site's actual content."
                : source === "business"
                  ? "Prompts below were built from this site's offering and location."
                  : "Site unreadable — fell back to generic prompts. Check the URL and retry."}
          </p>
        )}
      </Card>

      {tests.length > 0 && (
        <div className="flex justify-end">
          <button onClick={() => openDialog()} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
            <Pencil size={13} /> Edit prompts ({tests.length})
          </button>
        </div>
      )}
      {tests.length === 0 && (
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
                <h2 className="text-lg font-bold">Your 5 buyer prompts</h2>
                <p className="text-xs text-slate-400">
                  {suggesting ? "Reading your site and drafting suggestions…" : suggestSource === "llm" ? "Suggested by AI from your site — edit freely." : suggestSource ? "Suggested from your site — edit freely." : "Edit, remove, or add your own."}
                </p>
              </div>
              <button onClick={() => setDialogOpen(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"><X size={16} /></button>
            </div>
            {suggesting ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                <Loader2 size={16} className="animate-spin" /> Drafting prompts from {domain}…
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
                {draft.length < 10 && (
                  <button onClick={() => setDraft([...draft, ""])}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/20 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5">
                    <Plus size={14} /> Add another prompt ({draft.length}/10)
                  </button>
                )}
                <button onClick={saveAndRun} disabled={!draft.some((p) => p.trim()) || loading}
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
