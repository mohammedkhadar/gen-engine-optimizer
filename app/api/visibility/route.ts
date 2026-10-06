import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { simulatePromptTests, competitorSet, brandStats } from "@/lib/geo-engine";
import { livePromptTest, providerStatus } from "@/lib/providers/citations";
import { buildBattery } from "@/lib/prompts";
import { prisma, hasDatabase } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { brand = "Acme", domain = "acme.com", competitors: rivalNames = [], url: rawUrl, prompts: customPrompts } = await req.json().catch(() => ({}));
  const b = String(brand);
  const d = String(domain);

  const { prompts: battery, source: batterySource } = await buildBattery(b, d, rawUrl ? String(rawUrl) : undefined, customPrompts);

  const base = simulatePromptTests(b, d, battery);
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
  const rivals: (string | { name?: string; domain?: string })[] = Array.isArray(rivalNames) ? rivalNames.slice(0, 8) : [];
  const rivalStats = rivals
    .map((r) => {
      if (typeof r === "string") return { name: r, domain: undefined as string | undefined };
      return { name: String(r.name ?? ""), domain: r.domain ? String(r.domain) : undefined };
    })
    .filter((r) => r.name.trim());
  const comparison = [
    brandStats(b, d),
    ...rivalStats
      .filter((r) => r.name.toLowerCase() !== b.toLowerCase())
      .map((r) => brandStats(r.name, r.domain)),
  ];

  // Persist prompt runs when DB configured (best-effort). The domain is
  // created on first tracking run, so Prompt Lab works standalone — no audit
  // required — and rows are scoped to the signed-in user like audits are.
  try {
    if (hasDatabase) {
      const session = await getServerSession(authOptions).catch(() => null);
      const ownerEmail = session?.user?.email ?? null;
      const owner = ownerEmail
        ? await prisma.user.findUnique({ where: { email: ownerEmail } }).catch(() => null)
        : null;
      const urlKey = `https://${d}/`;
      let dom = owner
        ? await prisma.domain.findFirst({ where: { userId: owner.id, url: urlKey } })
        : await prisma.domain.findFirst({ where: { url: urlKey } });
      if (!dom) {
        dom = await prisma.domain.create({
          data: owner
            ? { userId: owner.id, url: urlKey, brand: b }
            : { id: `anon-${d}`, url: urlKey, brand: b },
        }).catch(async () => prisma.domain.findFirst({ where: { url: urlKey } }));
      }
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

  return NextResponse.json({ tests, competitors, comparison, avgVisibility, providers: providerStatus(), batterySource });
}
