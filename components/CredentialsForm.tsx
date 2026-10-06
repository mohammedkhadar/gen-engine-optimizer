"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export function CredentialsForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name: name || undefined }),
        }).then((r) => r.json());
        if (!res.ok && res.error) throw new Error(res.error);
      }
      const out = await signIn("credentials", { email, password, callbackUrl, redirect: false });
      if (out?.error) throw new Error(friendlyError(out.error));
      window.location.href = out?.url ?? callbackUrl;
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 border-t border-white/10 pt-4 text-left">
      <div className="mb-3 flex rounded-xl bg-black/40 p-1 text-sm">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(""); }}
            className={`flex-1 rounded-lg px-3 py-1.5 font-medium ${mode === m ? "bg-white/10 text-white" : "text-slate-400"}`}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-2">
        {mode === "signup" && (
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" autoComplete="name"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500/60" />
        )}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" type="email" required autoComplete="email"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500/60" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "Password (8+ characters)" : "Password"} type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm outline-none placeholder:text-slate-600 focus:border-violet-500/60" />
        {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">{error}</p>}
        <button disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold hover:bg-white/5 disabled:opacity-60">
          {busy && <Loader2 size={15} className="animate-spin" />}
          {busy ? "Please wait…" : mode === "signin" ? "Sign in with email" : "Create free account"}
        </button>
      </form>
    </div>
  );
}

function friendlyError(code: string) {
  if (/credentialssignin/i.test(code)) return "Wrong email or password.";
  return code;
}
