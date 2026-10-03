import Link from "next/link";
import { LayoutDashboard, Radar, MessagesSquare, Trophy, FileText, Settings } from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/audit", label: "GEO Audit", icon: Radar },
  { href: "/dashboard/prompts", label: "Prompt Lab", icon: MessagesSquare },
  { href: "/dashboard/competitors", label: "Competitors", icon: Trophy },
  { href: "/dashboard/content", label: "Content Optimizer", icon: FileText },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-white/10 bg-black/30 p-4 md:flex">
        <Link href="/" className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 font-bold">R</div>
          <span className="font-bold">RankAI <span className="text-xs font-medium text-slate-400">GEO</span></span>
        </Link>
        <nav className="mt-4 space-y-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
              <l.icon size={18} /> {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm">
          <div className="font-semibold">Free forever 🎉</div>
          <div className="mt-1 text-xs text-slate-400">All engines · unlimited audits</div>
          <Link href="/dashboard/audit" className="mt-3 block rounded-lg bg-white px-3 py-2 text-center text-xs font-semibold text-black">Run audit</Link>
        </div>
      </aside>
      <div className="flex-1">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 bg-black/20 px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-lg bg-white/5 px-3 py-1.5 text-xs">{l.label}</Link>
          ))}
        </div>
        <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
