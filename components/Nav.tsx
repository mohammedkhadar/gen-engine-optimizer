import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function Nav({ ctaHref }: { ctaHref?: string }) {
  const session = await getServerSession(authOptions).catch(() => null);
  const dest = ctaHref ?? (session ? "/dashboard" : "/login?mode=signup");
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0F1A]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 font-bold">R</div>
          <span className="text-lg font-bold">RankAI <span className="text-xs font-medium text-slate-400">GEO</span></span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          <Link href="/#features" className="hover:text-white">Features</Link>
          <Link href="/#how" className="hover:text-white">How it works</Link>
          <Link href="/video" className="hover:text-white">Video</Link>
          <Link href="/research" className="hover:text-white">Research</Link>
          <Link href="/pricing" className="hover:text-white">Pricing</Link>
        </nav>
        <div className="flex items-center gap-3">
          {session ? (
            <span className="hidden truncate text-sm text-slate-400 sm:block">{session.user?.email}</span>
          ) : (
            <Link href="/login" className="hidden text-sm text-slate-300 hover:text-white sm:block">Sign in</Link>
          )}
          <Link href={dest} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-slate-200">
            {session ? "Open dashboard" : "Get started free"}
          </Link>
        </div>
      </div>
    </header>
  );
}
