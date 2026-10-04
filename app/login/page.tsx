import Link from "next/link";
import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { SignInButton } from "@/components/SignInButton";
import { authEnabled } from "@/lib/auth";
import { Check } from "lucide-react";

export default function LoginPage({ searchParams }: { searchParams?: { mode?: string } }) {
  const isSignup = searchParams?.mode === "signup";
  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-3xl font-bold">{isSignup ? "Create your free account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {isSignup
            ? "One click with Google — free audit, fix list and tracking included."
            : "Sign in to pick up where you left off."}
        </p>
        {!authEnabled ? (
          <div className="glass mt-6 rounded-2xl p-6 text-sm text-slate-300">
            <p className="font-semibold text-amber-300">Demo mode — auth not configured</p>
            <p className="mt-2 text-slate-400">
              Add <code>GOOGLE_CLIENT_ID</code> + <code>GOOGLE_CLIENT_SECRET</code> (and
              <code> DATABASE_URL</code>) to enable real sign-in. Meanwhile the full
              product works locally without login.
            </p>
            <Link href="/dashboard" className="mt-4 block rounded-xl bg-white px-4 py-2.5 font-semibold text-black">
              Continue to dashboard →
            </Link>
          </div>
        ) : (
          <div className="glass mt-6 rounded-2xl p-6">
            <Suspense fallback={<div className="text-sm text-slate-400">Loading…</div>}>
              <SignInButton signup={isSignup} />
            </Suspense>
            {isSignup && (
              <ul className="mt-4 space-y-1.5 text-left text-xs text-slate-400">
                {["Free 60-second GEO audit", "Ranked fix list + generators", "No credit card, cancel anytime"].map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check size={14} className="mt-0.5 shrink-0 text-emerald-400" />{f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
