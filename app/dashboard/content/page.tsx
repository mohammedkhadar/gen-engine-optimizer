"use client";
import { useState } from "react";
import { Card, Badge } from "@/components/ui";
import { Copy, Check, Wand2, Download, FileText, Loader2 } from "lucide-react";

export default function ContentPage() {
  const [input, setInput] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchNote, setFetchNote] = useState("");
  const [out, setOut] = useState<any>(null);
  const [copied, setCopied] = useState("");
  const [llmsBrand, setLlmsBrand] = useState("Acme");
  const [llmsDomain, setLlmsDomain] = useState("acme.com");
  const [llmsTagline, setLlmsTagline] = useState("What we do, who we serve, and why we're the trusted choice.");
  const [llmsTxt, setLlmsTxt] = useState("");
  const [llmsLoading, setLlmsLoading] = useState(false);

  const fetchFromUrl = async () => {
    const u = pageUrl.trim();
    if (!u || fetching) return;
    setFetching(true); setFetchNote("");
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not read that page");
      setInput(data.text);
      setOut(null);
      setFetchNote(`Pulled ${data.chars.toLocaleString()} chars${data.truncated ? " (trimmed to essentials)" : ""}${data.title ? ` — "${data.title.slice(0, 60)}"` : ""}. Edit below if needed, then generate.`);
    } catch (e: any) {
      setFetchNote(e.message);
    } finally {
      setFetching(false);
    }
  };

  // Derive buyer-question FAQs from the actual input text: split into
  // sentences, classify each by its signals (price, time, action, place,
  // proof), and turn the strongest matches into Q&As quoted from the source.
  // Chrome (nav/login/cart/cookie boilerplate) is filtered first so it can
  // never become an "answer"; price matches require a currency figure tied to
  // pricing words, so testimonials like "$4M+ business" don't qualify.
  const JUNK = /skip to content|log in|sign in|sign up|create account|shopping cart|\bcart\b|\bmenu\b|cookies|newsletter|subscribe|follow us|all rights reserved|terms of (service|use)|privacy policy/i;
  const buildFaqs = (raw: string) => {
    const sentences = raw
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 400 && !JUNK.test(s));
    type Hit = { q: string; a: string; rank: number };
    const hits: Hit[] = [];
    const seen = new Set<string>();
    const push = (q: string, a: string, rank: number) => {
      if (seen.has(q)) return;
      seen.add(q);
      hits.push({ q, a: a.length > 220 ? a.slice(0, 217).trimEnd() + "…" : a, rank });
    };
    const has = (re: RegExp) => (s: string) => re.test(s);
    const isPrice = has(/([$€£]\s?\d[\d,.]*[^.]{0,50}(price|cost|pricing|plan|month|year|user|\/mo\b))|((price|cost|pricing|starting at)[^.]{0,50}[$€£]\s?\d)|(free trial|per (month|year|user)|\/mo\b|starting at \$)/i);
    const isTime = has(/\b\d+\s?(minute|hour|day|week|month)s?\b|same-?day|24\s?\/\s?7|setup in|takes (only|just|less than)|get (started|going) in/i);
    const isAction = has(/\b(book|call|sign\s?up|start|try|visit|contact|order|schedule|download|get started)\b/i);
    const isPlace = has(/\bin\s+[A-Z][a-z]+|\b[A-Z][a-z]+\s?(city|town|area)\b|address|location|near me|open/i);
    const isProof = has(/★|stars?|reviews?|rated|trusted|award|certified|guarantee|years?/i);
    sentences.forEach((s, i) => {
      if (isPrice(s)) push("How much does it cost?", s, 100 - i);
      else if (isTime(s)) push("How fast is it?", s, 90 - i);
      else if (isAction(s)) push("How do I get started?", s, 80 - i);
      else if (isPlace(s)) push("Where are you located?", s, 70 - i);
      else if (isProof(s)) push("Why should I trust you?", s, 60 - i);
      else if (i === 0) push("What do you offer?", s, 50);
    });
    // Fallback so short/generic copy still yields something grounded.
    if (!hits.length && sentences.length) push("What is on this page?", sentences.slice(0, 2).join(" "), 10);
    return hits
      .sort((a, b) => b.rank - a.rank)
      .slice(0, 5)
      .map(({ q, a }) => ({ q, a }));
  };

  const optimize = () => {
    const excerpt = `TL;DR: ${input.trim().slice(0, 180)} — verified for 2026, with transparent pricing, real reviews, and same-week booking.`;
    const faqs = buildFaqs(input);
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    };
    setOut({ excerpt, faqs, schema });
  };

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  };

  const genLlms = async () => {
    setLlmsLoading(true);
    try {
      const res = await fetch("/api/llms-txt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: llmsBrand,
          domain: llmsDomain,
          tagline: llmsTagline,
          faqs: out?.faqs ?? [],
        }),
      }).then((r) => r.json());
      setLlmsTxt(res.llmsTxt ?? "");
    } finally {
      setLlmsLoading(false);
    }
  };

  const downloadLlms = () => {
    const blob = new Blob([llmsTxt], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "llms.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Content Optimizer</h1>
        <p className="text-sm text-slate-400">Rewrite any copy so LLMs extract it, quote it, and cite it.</p>
      </div>
      <Card>
        <label className="text-sm font-medium">Pull copy straight from a URL</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input value={pageUrl} onChange={(e) => setPageUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && fetchFromUrl()}
            placeholder="https://yourdomain.com/pricing"
            className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500/60" />
          <button onClick={fetchFromUrl} disabled={!pageUrl.trim() || fetching}
            className="flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-medium hover:bg-white/5 disabled:opacity-40">
            {fetching ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {fetching ? "Reading…" : "Fetch page"}
          </button>
        </div>
        {fetchNote && <p className="mt-2 text-xs text-slate-400">{fetchNote}</p>}
        <div className="my-3 flex items-center gap-3 text-[11px] uppercase tracking-widest text-slate-600">
          <span className="h-px flex-1 bg-white/10" /> or paste manually <span className="h-px flex-1 bg-white/10" />
        </div>
        <label className="text-sm font-medium">Paste your page copy</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={5}
          placeholder="e.g. Acme Dental Studio offers teeth whitening in Austin. We have good prices and friendly staff. Book today."
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500/60" />
        <button onClick={optimize} disabled={!input.trim()} className="mt-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold disabled:opacity-40">
          <Wand2 size={15} /> Make it citable →
        </button>
      </Card>
      {out && (
        <div className="grid gap-4 *:min-w-0">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">AI excerpt block <Badge tone="green">paste at top of page</Badge></h3>
              <button onClick={() => copy("excerpt", out.excerpt)} className="text-xs text-slate-400 hover:text-white flex gap-1 items-center">
                {copied === "excerpt" ? <Check size={13} /> : <Copy size={13} />} Copy
              </button>
            </div>
            <p className="mt-2 rounded-xl bg-black/30 p-4 text-sm leading-relaxed">{out.excerpt}</p>
          </Card>
          <Card>
            <h3 className="font-semibold">FAQ block (rewritten as buyer questions)</h3>
            <div className="mt-3 space-y-2">
              {out.faqs.map((f: any) => (
                <div key={f.q} className="rounded-xl bg-white/[0.03] p-3 text-sm">
                  <div className="font-medium">Q: {f.q}</div>
                  <div className="mt-1 text-slate-400">A: {f.a}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">FAQ Page JSON-LD schema</h3>
              <button onClick={() => copy("schema", JSON.stringify(out.schema, null, 2))} className="text-xs text-slate-400 hover:text-white flex gap-1 items-center">
                {copied === "schema" ? <Check size={13} /> : <Copy size={13} />} Copy JSON
              </button>
            </div>
            <pre className="mt-2 overflow-x-auto rounded-xl bg-black/50 p-4 text-xs text-emerald-200">{JSON.stringify(out.schema, null, 2)}</pre>
          </Card>
          <Card>
            <h3 className="font-semibold">GEO rewrite checklist</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
              {["Lead with 40–60 word direct answer","Headings as questions (What/How much/vs)","One stat per section + source link","Bullets & tables over walls of text","Author + date + reviews visible"].map((c) => (
                <li key={c} className="flex gap-2"><Check size={15} className="mt-0.5 text-emerald-400" />{c}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}
      <Card>
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-violet-300" />
          <h3 className="font-semibold">Your llms.txt file <Badge tone="green">new</Badge></h3>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          The file AI crawlers look for. Generate it, download it, and publish it at <code>https://yourdomain.com/llms.txt</code> (upload to your site root or ask your developer — one file, one upload).
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <input value={llmsBrand} onChange={(e) => setLlmsBrand(e.target.value)} placeholder="Brand"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-violet-500/60" />
          <input value={llmsDomain} onChange={(e) => setLlmsDomain(e.target.value)} placeholder="domain.com"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-violet-500/60" />
          <input value={llmsTagline} onChange={(e) => setLlmsTagline(e.target.value)} placeholder="One-line description"
            className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-violet-500/60 sm:col-span-1" />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Tip: run the optimizer above first — your rewritten FAQs are reused in the file automatically.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={genLlms} disabled={llmsLoading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold disabled:opacity-60">
            {llmsLoading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
            {llmsLoading ? "Generating…" : "Generate llms.txt"}
          </button>
          {llmsTxt && (
            <>
              <button onClick={() => copy("llms", llmsTxt)} className="flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-sm hover:bg-white/5">
                {copied === "llms" ? <Check size={14} /> : <Copy size={14} />} Copy
              </button>
              <button onClick={downloadLlms} className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-slate-200">
                <Download size={14} /> Download llms.txt
              </button>
            </>
          )}
        </div>
        {llmsTxt && (
          <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-black/50 p-4 text-xs text-emerald-200">{llmsTxt}</pre>
        )}
      </Card>
    </div>
  );
}
