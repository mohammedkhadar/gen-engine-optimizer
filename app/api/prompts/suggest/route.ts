import { NextRequest, NextResponse } from "next/server";
import { buildBattery } from "@/lib/prompts";

// Suggest a prompt battery without running any tests (no provider cost
// beyond one generation call). Used by the Prompt Lab setup dialog.
export async function POST(req: NextRequest) {
  const { brand = "Acme", domain = "acme.com", url } = await req.json().catch(() => ({}));
  const { prompts, source } = await buildBattery(String(brand), String(domain), url ? String(url) : undefined);
  return NextResponse.json({ prompts: prompts.slice(0, 5), source });
}
