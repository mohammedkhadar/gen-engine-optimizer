import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { LayoutDashboard, Radar, MessagesSquare, Trophy } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/audit", label: "GEO Audit", icon: Radar },
  { href: "/dashboard/prompts", label: "Prompt Lab", icon: MessagesSquare },
  { href: "/dashboard/competitors", label: "Competitors", icon: Trophy },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden max-h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-black/30 p-4 md:sticky md:top-0 md:flex md:h-screen">
        <Link href="/" className="flex shrink-0 items-center gap-2 px-2 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 font-bold">C</div>
          <span className="font-bold">CitedAI <span className="text-xs font-medium text-slate-400">GEO</span></span>
        </Link>
        <nav className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
              <l.icon size={18} /> {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 shrink-0 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4 text-sm">
          <div className="font-semibold">Growth plan trial</div>
          <div className="mt-1 text-xs text-slate-400">9 days left · 412 prompts used</div>
          <Link href="/pricing" className="mt-3 block rounded-lg bg-white px-3 py-2 text-center text-xs font-semibold text-black">Upgrade</Link>
        </div>
        <div className="mt-3 shrink-0 space-y-1 border-t border-white/10 pt-3">
          {email ? (
            <div className="truncate rounded-lg px-3 py-2 text-xs text-slate-400" title={email}>
              Signed in as<br /><span className="font-medium text-slate-200">{email}</span>
            </div>
          ) : null}
          {email ? <SignOutButton /> : null}
        </div>
      </aside>
      <div className="flex-1">
        <div className="flex items-center gap-2 overflow-x-auto border-b border-white/10 bg-black/20 px-4 py-3 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-lg bg-white/5 px-3 py-1.5 text-xs">{l.label}</Link>
          ))}
          {email ? (
            <SignOutButton className="whitespace-nowrap bg-white/5 px-3 py-1.5 text-xs" />
          ) : null}
        </div>
        <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
