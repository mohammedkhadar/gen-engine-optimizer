"use client";
import { useState } from "react";
import { Card, Badge } from "@/components/ui";
import { Copy, Check, Wand2, Download, FileText, Loader2 } from "lucide-react";

export default function ContentPage() {
  const [input, setInput] = useState("");
  const [out, setOut] = useState<any>(null);
  const [copied, setCopied] = useState("");
  const [llmsBrand, setLlmsBrand] = useState("Acme");
  const [llmsDomain, setLlmsDomain] = useState("acme.com");
  const [llmsTagline, setLlmsTagline] = useState("What we do, who we serve, and why we're the trusted choice.");
  const [llmsTxt, setLlmsTxt] = useState("");
  const [llmsLoading, setLlmsLoading] = useState(false);

  const optimize = () => {
    const brand = "your business";
    const excerpt = `TL;DR: ${input.trim().slice(0, 180)} — verified for 2026, with transparent pricing, real reviews, and same-week booking.`;
    const faqs = [
      { q: "How much does it cost?", a: "Transparent flat-rate pricing with no hidden fees — see the full price table below, updated 2026." },
      { q: "Why choose us vs competitors?", a: "Higher review volume, credentialed specialists, and same-week availability. Comparison table below." },
      { q: "How do I book?", a: "Book online in 60 seconds or call us — address, hours and map included with Organization schema." },
    ];
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
        <label className="text-sm font-medium">Paste your page copy</label>
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={5}
          placeholder="e.g. Acme Dental Studio offers teeth whitening in Austin. We have good prices and friendly staff. Book today."
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500/60" />
        <button onClick={optimize} disabled={!input.trim()} className="mt-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-emerald-500 px-5 py-2.5 text-sm font-semibold disabled:opacity-40">
          <Wand2 size={15} /> Make it citable →
        </button>
      </Card>
      {out && (
        <div className="grid gap-4">
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
              <h3 className="font-semibold">FAQPage JSON-LD schema</h3>
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
