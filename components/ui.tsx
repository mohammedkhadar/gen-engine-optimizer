import { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("glass rounded-2xl p-5 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]", className)}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: ReactNode;
  tone?: "slate" | "green" | "amber" | "red" | "violet" | "blue";
}) {
  const tones: Record<string, string> = {
    slate: "bg-white/10 text-slate-200 border-white/10",
    green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    red: "bg-red-500/15 text-red-300 border-red-500/30",
    violet: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    blue: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  const color = value >= 75 ? "from-emerald-400 to-emerald-500" : value >= 55 ? "from-amber-400 to-orange-500" : "from-red-400 to-red-500";
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-white/10", className)}>
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", color)}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const color = score >= 75 ? "#34d399" : score >= 55 ? "#fbbf24" : "#f87171";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.1)" strokeWidth={10} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={10}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (score / 100) * c}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold">{score}</div>
        <div className="text-[11px] uppercase tracking-widest text-slate-400">/ 100</div>
      </div>
    </div>
  );
}

export function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">{kicker}</div>
      <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-slate-400">{sub}</p>}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-slate-400 sm:flex-row">
        <div>© 2026 CitedAI GEO Platform. Built for the AI-search era.</div>
        <div className="flex gap-5">
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/dashboard/audit" className="hover:text-white">Audit</Link>
          <Link href="/research" className="hover:text-white">Research</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
        </div>
      </div>
    </footer>
  );
}
