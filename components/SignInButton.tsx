"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

const FRIENDLY: Record<string, string> = {
  OAuthSignin: "Could not start Google sign-in. Check your connection and try again.",
  OAuthCallback: "Google rejected the sign-in (often: app in Testing mode, email not added as test user, or redirect URI mismatch).",
  AccessDenied: "Access denied for this account.",
  Configuration: "Auth is misconfigured on the server.",
};

export function SignInButton({ signup }: { signup?: boolean }) {
  const [busy, setBusy] = useState(false);
  const params = useSearchParams();
  const err = params.get("error");

  return (
    <div>
      {err && (
        <p className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-left text-xs text-red-300">
          {FRIENDLY[err] ?? `Sign-in failed (${err}).`}
        </p>
      )}
      <button
        onClick={() => { setBusy(true); signIn("google", { callbackUrl: "/dashboard" }); }}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 font-semibold text-black hover:bg-slate-200 disabled:opacity-60"
      >
        {busy && <Loader2 size={15} className="animate-spin" />}
        {busy ? "Redirecting to Google…" : signup ? "Continue with Google — it's free" : "Sign in with Google →"}
      </button>
      <p className="mt-3 text-xs text-slate-500">You&apos;ll return directly to the dashboard.</p>
    </div>
  );
}
