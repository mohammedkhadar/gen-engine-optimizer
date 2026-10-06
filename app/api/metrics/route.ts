import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma, hasDatabase } from "@/lib/db";

// Dashboard metrics aggregated from the user's own PromptRun rows.
// Windows: last 7d vs prior 7d. Empty (no runs) → zeros, never placeholders.
export async function GET() {
  if (!hasDatabase) return NextResponse.json({ empty: true, runs: 0 });
  try {
    const session = await getServerSession(authOptions).catch(() => null);
    const email = session?.user?.email ?? null;
    if (!email) return NextResponse.json({ empty: true, runs: 0 });
    const owner = await prisma.user.findUnique({ where: { email } }).catch(() => null);
    if (!owner) return NextResponse.json({ empty: true, runs: 0 });

    const now = new Date();
    const ago = (d: number) => new Date(now.getTime() - d * 864e5);
    const runs = await prisma.promptRun.findMany({
      where: { domain: { userId: owner.id }, createdAt: { gte: ago(28) } },
      orderBy: { createdAt: "asc" },
    });
    if (!runs.length) return NextResponse.json({ empty: true, runs: 0 });

    const inWin = (r: any, d: number) => new Date(r.createdAt) >= ago(d);
    const last7 = runs.filter((r) => inWin(r, 7));
    const prev7 = runs.filter((r) => !inWin(r, 7) && new Date(r.createdAt) >= ago(14));
    const mentions = last7.filter((r) => r.mentioned).length;
    const prevMentions = prev7.filter((r) => r.mentioned).length;
    const rate = last7.length ? Math.round((mentions / last7.length) * 100) : 0;

    // prompts won: distinct prompts where >=3 different engines mentioned the brand (7d)
    const byPrompt = new Map<string, Set<string>>();
    for (const r of last7) {
      if (!byPrompt.has(r.prompt)) byPrompt.set(r.prompt, new Set());
      if (r.mentioned) byPrompt.get(r.prompt)!.add(r.engine);
    }
    const won = [...byPrompt.values()].filter((s) => s.size >= 3).length;

    // mentions per day, last 14d (trend)
    const days: { d: string; you: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = ago(i);
      const key = day.toISOString().slice(0, 10);
      const label = day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const n = runs.filter((r) => r.createdAt.toISOString().slice(0, 10) === key && r.mentioned).length;
      days.push({ d: label, you: n });
    }

    // mention rate by engine (7d)
    const byEngine = new Map<string, { m: number; t: number }>();
    for (const r of last7) {
      const e = byEngine.get(r.engine) ?? { m: 0, t: 0 };
      e.t++;
      if (r.mentioned) e.m++;
      byEngine.set(r.engine, e);
    }
    const engines = [...byEngine.entries()].map(([engine, e]) => ({
      engine,
      you: e.t ? Math.round((e.m / e.t) * 100) : 0,
    }));

    // recent citations feed
    const feed = runs
      .filter((r) => r.mentioned)
      .slice(-5)
      .reverse()
      .map((r) => ({
        text: `${r.engine} cited you for “${r.prompt.length > 60 ? r.prompt.slice(0, 57) + "…" : r.prompt}”`,
        when: timeAgo(new Date(r.createdAt)),
        sentiment: r.sentiment,
      }));

    return NextResponse.json({
      empty: false,
      runs: runs.length,
      mentions7d: mentions,
      mentionsDelta: mentions - prevMentions,
      citationRate: rate,
      promptsWon: won,
      promptsTotal: byPrompt.size,
      trend: days,
      engines,
      feed,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
