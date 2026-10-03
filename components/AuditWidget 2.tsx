"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

export function AuditWidget() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    const clean = url.includes("://") ? url : `https://${url}`;
    router.push(`/dashboard/audit?url=${encodeURIComponent(clean)}`);
  };

  return (
    <form onSubmit={submit} className="glass rounded-2xl p-4 shadow-2xl">
      <label className="text-sm font-medium text-slate-300">Instant AI-visibility audit — try your homepage</label>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="acme.com"
            className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-10 pr-3 text-sm outline-none placeholder:text-slate-500 focus:border-violet-500/60"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? "Auditing…" : "Audit free"}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">Live fetch: schema, E-E-A-T, answer-readiness, citations. No signup.</p>
    </form>
  );
}
