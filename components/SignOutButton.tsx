"use client";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white",
        className
      )}
    >
      <LogOut size={18} className="shrink-0" />
      <span className="whitespace-nowrap">Sign out</span>
    </button>
  );
}
