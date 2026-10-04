import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, fetchHtml, extractText } from "@/lib/fetch-page";

// Pull readable copy out of any URL so the Content Optimizer can rewrite it
// without copy-paste. Returns title + cleaned text (capped) for editing.
export async function POST(req: NextRequest) {
  try {
    const { url: raw } = await req.json();
    if (!raw || typeof raw !== "string") return NextResponse.json({ error: "Provide a URL" }, { status: 400 });
    const url = normalizeUrl(raw);
    const { html, loadMs } = await fetchHtml(url);
    if (!html) {
      const host = new URL(url).hostname;
      const walled = /facebook|instagram|linkedin|twitter|x\.com|tiktok/.test(host);
      return NextResponse.json({
        error: walled
          ? `${host} blocks automated readers (login wall / bot protection). Copy the visible text and paste it manually below instead.`
          : `Could not fetch a readable page at that URL (server refused or timed out). Check the address, or paste the text manually below.`,
        url,
      }, { status: 422 });
    }
    const { title, text, truncated } = extractText(html);
    if (!text) return NextResponse.json({ error: "Page fetched but no readable text found (JS-only or blocked page?).", url }, { status: 422 });
    return NextResponse.json({ url, title, text, truncated, loadMs, chars: text.length });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Extract failed" }, { status: 400 });
  }
}
