import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, fetchHtml, extractText } from "@/lib/fetch-page";
import { suggestCompetitors } from "@/lib/providers/citations";

// Suggest rival businesses for the Competitor Intel setup dialog.
// Returns [] when no LLM key is set — the dialog then starts empty.
export async function POST(req: NextRequest) {
  const { brand = "", domain = "", url } = await req.json().catch(() => ({}));
  const b = String(brand);
  const d = String(domain);
  try {
    const target = normalizeUrl(String(url || `https://${d}`));
    const { html } = await fetchHtml(target);
    if (!html) return NextResponse.json({ competitors: [], source: "unfetchable" });
    const rivals = await suggestCompetitors(b, d, extractText(html).text);
    return NextResponse.json({ competitors: rivals, source: rivals.length ? "llm" : "none" });
  } catch {
    return NextResponse.json({ competitors: [], source: "none" });
  }
}
