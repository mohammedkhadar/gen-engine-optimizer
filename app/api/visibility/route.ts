import { NextRequest, NextResponse } from "next/server";
import { simulatePromptTests, competitorSet, brandStats } from "@/lib/geo-engine";
import { livePromptTest, providerStatus } from "@/lib/providers/citations";
import { prisma, hasDatabase } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { brand = "Acme", domain = "acme.com", competitors: rivalNames = [] } = await req.json().catch(() => ({}));
  const b = String(brand);
  const d = String(domain);

  const base = simulatePromptTests(b, d);
  // Live per-prompt enrichment (real providers when keys exist, else heuristic).
  const tests = await Promise.all(
    base.map(async (t) => {
      try {
        const details = await livePromptTest(b, d, t.prompt);
        const mentions = details.filter((x) => x.mentioned).length;
        return { ...t, details, mentions, visibility: Math.round((mentions / details.length) * 100) };
      } catch {
        return { ...t, details: t.details.map((x) => ({ ...x, provider: "heuristic" })) };
      }
    })
  );

  const competitors = competitorSet(b);
  const avgVisibility = Math.round(tests.reduce((a, t) => a + t.visibility, 0) / tests.length);

  // User-defined comparison table: you + each named rival, same methodology.
  const rivals: string[] = Array.isArray(rivalNames) ? rivalNames.map(String).filter(Boolean).slice(0, 8) : [];
  const comparison = [brandStats(b, d), ...rivals.filter((r) => r.toLowerCase() !== b.toLowerCase()).map((r) => brandStats(r))];

  // Persist prompt runs when DB configured (best-effort).
  try {
    if (hasDatabase) {
      const dom = await prisma.domain.findFirst({ where: { url: { contains: d } } });
      if (dom) {
        for (const t of tests) {
          for (const r of t.details as any[]) {
            await prisma.promptRun.create({
              data: {
                domainId: dom.id,
                prompt: t.prompt,
                category: t.category,
                engine: r.engine,
                mentioned: r.mentioned,
                position: r.position,
                sentiment: r.sentiment,
                snippet: r.snippet?.slice(0, 2000),
                sources: r.sources ? (r.sources as any) : undefined,
                provider: r.provider ?? "heuristic",
              },
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("prompt persist failed (non-fatal):", e);
  }

  return NextResponse.json({ tests, competitors, comparison, avgVisibility, providers: providerStatus() });
}
