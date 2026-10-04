"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function CheckoutButton({ plan, label, hot }: { plan: string; label: string; hot?: boolean }) {
  const [busy, setBusy] = useState(false);

  const checkout = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      }).then((r) => r.json());
      window.location.href = res.url;
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={checkout}
      disabled={busy}
      className={cn(
        "mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60",
        hot ? "bg-white text-black hover:bg-slate-200" : "glass hover:bg-white/10"
      )}
    >
      {busy && <Loader2 size={14} className="animate-spin" />}
      {label}
    </button>
  );
}
