// Shared prompt-battery builder: LLM-written from site content → template
// battery from page facts → generic battery. Used by /api/visibility (run)
// and /api/prompts/suggest (preview without running tests).
import { simulatePromptTests, buildBusinessPrompts } from "@/lib/geo-engine";
import { normalizeUrl, fetchHtml, extractText } from "@/lib/fetch-page";
import { generateBusinessPrompts } from "@/lib/providers/citations";

export type BatterySource = "custom" | "llm" | "business" | "generic";

export async function buildBattery(
  brand: string,
  domain: string,
  rawUrl?: string,
  custom?: string[]
): Promise<{ prompts: string[]; source: BatterySource }> {
  const clean = (custom ?? []).map((p) => String(p).trim()).filter(Boolean).slice(0, 10);
  if (clean.length) return { prompts: clean, source: "custom" };
  try {
    const target = normalizeUrl(String(rawUrl || `https://${domain}`));
    const { html } = await fetchHtml(target);
    if (html) {
      const pageText = extractText(html).text;
      const llm = await generateBusinessPrompts(brand, domain, pageText);
      if (llm) return { prompts: llm, source: "llm" };
      return { prompts: buildBusinessPrompts(brand, domain, pageText), source: "business" };
    }
  } catch { /* generic fallback */ }
  return { prompts: simulatePromptTests(brand, domain).map((t) => t.prompt), source: "generic" };
}
