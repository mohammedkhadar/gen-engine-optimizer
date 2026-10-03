import Link from "next/link";
import { Nav } from "@/components/ui";
import { authEnabled } from "@/lib/auth";

export default function LoginPage() {
  return (
    <div>
      <Nav />
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="text-3xl font-bold">Sign in to RankAI</h1>
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
            <a href="/api/auth/signin?callbackUrl=/dashboard" className="block rounded-xl bg-white px-4 py-2.5 font-semibold text-black">
              Sign in →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
