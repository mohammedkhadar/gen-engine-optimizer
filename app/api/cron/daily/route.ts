import { NextRequest, NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/db";
import { listAuditsLocal } from "@/lib/store";

// Daily cron: Vercel Cron / external scheduler hits this with CRON_SECRET.
// Re-checks recent domains and appends fresh audits + prompt runs via internal calls.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const base = process.env.NEXTAUTH_URL ?? req.nextUrl.origin;

  let targets: { url: string; brand: string }[] = [];
  try {
    if (hasDatabase) {
      const domains = await prisma.domain.findMany({ orderBy: { updatedAt: "desc" }, take: 25 });
      targets = domains.map((d) => ({ url: d.url, brand: d.brand }));
    } else {
      const audits = await listAuditsLocal();
      const seen = new Map<string, string>();
      for (const a of audits) if (!seen.has(a.url)) seen.set(a.url, new URL(a.url).hostname);
      targets = Array.from(seen.entries()).slice(0, 25).map(([url, brand]) => ({ url, brand }));
    }
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  const results = [];
  for (const t of targets) {
    try {
      const auditRes = await fetch(`${base}/api/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: t.url, brand: t.brand }),
      }).then((r) => r.json());
      const visRes = await fetch(`${base}/api/visibility`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: t.brand, domain: new URL(t.url).hostname }),
      }).then((r) => r.json()).catch(() => null);
      results.push({ url: t.url, overall: auditRes.overall, grade: auditRes.grade, avgVisibility: visRes?.avgVisibility ?? null });
    } catch (e: any) {
      results.push({ url: t.url, error: e.message });
    }
  }
  return NextResponse.json({ checked: results.length, results, at: new Date().toISOString() });
}
