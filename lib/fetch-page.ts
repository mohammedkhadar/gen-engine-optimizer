// Shared server-side page fetcher: normalize URL, download HTML, extract
// clean readable text. Used by the audit (signals) and the optimizer (rewrite).

export function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!u.includes("://")) u = "https://" + u;
  const parsed = new URL(u);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only http(s) URLs supported");
  return parsed.toString();
}

export async function fetchHtml(url: string, timeoutMs = 9000): Promise<{ html: string | null; loadMs: number }> {
  const started = Date.now();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "RankAI-GEO-Bot/1.0 (+https://rankai.geo; audits generative readiness)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    clearTimeout(t);
    const ct = res.headers.get("content-type") ?? "";
    if (res.ok && ct.includes("text/html")) {
      return { html: (await res.text()).slice(0, 600_000), loadMs: Date.now() - started };
    }
  } catch { /* fallback */ }
  return { html: null as string | null, loadMs: Date.now() - started };
}

const CHROME_PATTERNS = /skip to content|log in|sign in|sign up|create account|shopping cart|\bcart\b|\bmenu\b|^search$|cookies|cookie policy|newsletter|subscribe|follow us|all rights reserved|terms of (service|use)|privacy policy/i;

export function extractContentLines(html: string): string[] {
  // Prefer the main content landmark — nav/header/footer/aside are chrome.
  const main =
    /<main[\s>][\s\S]*?<\/main>/i.exec(html)?.[0] ??
    /<article[\s>][\s\S]*?<\/article>/i.exec(html)?.[0] ??
    html;
  const body = main
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ");
  const text = body
    .replace(/<\/(h1|h2|h3|h4|p|li|tr|div|section|article)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 25 && !CHROME_PATTERNS.test(l));
}

export function extractText(html: string, maxChars = 8000) {
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? "";
  const joined = extractContentLines(html).join("\n");
  return { title, text: joined.slice(0, maxChars), truncated: joined.length > maxChars };
}
