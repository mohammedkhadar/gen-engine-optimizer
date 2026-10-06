import Link from "next/link";
import { Suspense } from "react";
import { Nav } from "@/components/Nav";
import { SignInButton } from "@/components/SignInButton";
import { CredentialsForm } from "@/components/CredentialsForm";
import { googleEnabled, passwordEnabled } from "@/lib/auth";

export default function LoginPage({ searchParams }: { searchParams?: { mode?: string } }) {
  const isSignup = searchParams?.mode === "signup";
  const demo = !googleEnabled && !passwordEnabled;
  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-3xl font-bold">{isSignup ? "Create your free account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-slate-400">
          {isSignup
            ? "One click with Google, or email and password — free audit, fix list and tracking included."
            : "Sign in to pick up where you left off."}
        </p>
        {demo ? (
          <div className="glass mt-6 rounded-2xl p-6 text-sm text-slate-300">
            <p className="font-semibold text-amber-300">Demo mode — auth not configured</p>
            <p className="mt-2 text-slate-400">
              Add <code>GOOGLE_CLIENT_ID</code> + <code>GOOGLE_CLIENT_SECRET</code> for Google sign-in,
              or <code>DATABASE_URL</code> for email accounts. Meanwhile the full
              product works locally without login.
            </p>
            <Link href="/dashboard" className="mt-4 block rounded-xl bg-white px-4 py-2.5 font-semibold text-black">
              Continue to dashboard →
            </Link>
          </div>
        ) : (
          <div className="glass mt-6 rounded-2xl p-6">
            <Suspense fallback={<div className="text-sm text-slate-400">Loading…</div>}>
              {googleEnabled && <SignInButton signup={isSignup} />}
              {passwordEnabled && <CredentialsForm />}
              {!googleEnabled && passwordEnabled && (
                <p className="mt-3 text-[11px] text-slate-500">Google sign-in unlocks once GOOGLE_CLIENT_ID is set.</p>
              )}
            </Suspense>
            {isSignup && (
              <ul className="mt-4 space-y-1.5 text-left text-xs text-slate-400">
                {["Free 60-second GEO audit", "Ranked fix list + generators", "No credit card, cancel anytime"].map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="mt-0.5 text-emerald-400">✓</span>{f}
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
