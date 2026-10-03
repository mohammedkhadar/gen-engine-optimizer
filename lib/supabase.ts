import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Optional Supabase JS client (realtime, storage). Independent of Prisma:
// Prisma needs DATABASE_URL (Postgres connection string), this needs the
// API URL + publishable key. Null when not configured — app keeps working.
let client: SupabaseClient | null = null;

export const hasSupabaseClient =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function getSupabase(): SupabaseClient | null {
  if (!hasSupabaseClient) return null;
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
  }
  return client;
}
