import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { scoreUrl } from "@/lib/geo-engine";
import { normalizeUrl, fetchHtml } from "@/lib/fetch-page";
import { prisma, hasDatabase } from "@/lib/db";
import { saveAuditLocal } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { url: raw, brand } = await req.json();
    if (!raw || typeof raw !== "string") return NextResponse.json({ error: "Provide a URL" }, { status: 400 });
    const url = normalizeUrl(raw);
    const { html, loadMs } = await fetchHtml(url);
    const result = scoreUrl(url, html, loadMs);

    const record = {
      url: result.url,
      overall: result.overall,
      grade: result.grade,
      fetched: result.fetched,
      categories: result.categories,
      aiReadiness: result.aiReadiness,
      citations: result.citations,
      topActions: result.topActions,
      meta: result.meta,
      provider: "heuristic",
    };

    // Persist: Postgres when configured, else local JSON.
    // Audits are scoped to the signed-in user so accounts never see each
    // other's reports; logged-out audits stay anonymous.
    try {
      if (hasDatabase) {
        const host = new URL(url).hostname;
        const session = await getServerSession(authOptions).catch(() => null);
        const ownerEmail = session?.user?.email ?? null;
        const owner = ownerEmail
          ? await prisma.user.findUnique({ where: { email: ownerEmail } }).catch(() => null)
          : null;
        const domain = owner
          ? await (async () => {
              const existing = await prisma.domain.findFirst({ where: { userId: owner.id, url } });
              if (existing) return existing;
              return prisma.domain.create({ data: { userId: owner.id, url, brand: brand ?? host } });
            })()
          : await prisma.domain.upsert({
              where: { id: `anon-${host}` },
              update: { url },
              create: { id: `anon-${host}`, url, brand: brand ?? host },
            }).catch(async () => {
              const existing = await prisma.domain.findFirst({ where: { url } });
              if (existing) return existing;
              return prisma.domain.create({ data: { url, brand: brand ?? host } });
            });
        await prisma.audit.create({
          data: {
            domainId: (domain as any).id,
            url: record.url,
            overall: record.overall,
            grade: record.grade,
            fetched: record.fetched,
            categories: record.categories as any,
            aiReadiness: record.aiReadiness as any,
            citations: record.citations as any,
            topActions: record.topActions as any,
            meta: record.meta as any,
          },
        });
      } else {
        await saveAuditLocal(record);
      }
    } catch (e) {
      console.error("audit persist failed (non-fatal):", e);
    }

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Audit failed" }, { status: 400 });
  }
}
