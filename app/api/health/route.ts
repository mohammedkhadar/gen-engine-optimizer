import { NextResponse } from "next/server";
import { providerStatus } from "@/lib/providers/citations";
import { hasDatabase } from "@/lib/db";
import { authEnabled } from "@/lib/auth";
import { hasSupabaseClient } from "@/lib/supabase";

export async function GET() {
  return NextResponse.json({
    ok: true,
    at: new Date().toISOString(),
    services: {
      database: hasDatabase ? "postgres" : "local-fallback",
      supabase: hasSupabaseClient ? "configured" : "demo",
      auth: authEnabled ? "configured" : "demo",
      billing: "free",
      citations: providerStatus(),
    },
  });
}
