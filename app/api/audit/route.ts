import { NextRequest, NextResponse } from "next/server";
import { scoreUrl } from "@/lib/geo-engine";
import { prisma, hasDatabase } from "@/lib/db";
import { saveAuditLocal } from "@/lib/store";

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  if (!u.includes("://")) u = "https://" + u;
  const parsed = new URL(u);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only http(s) URLs supported");
  return parsed.toString();
}

async function fetchHtml(url: string) {
  const started = Date.now();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 9000);
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
    try {
      if (hasDatabase) {
        const host = new URL(url).hostname;
        const domain = await prisma.domain.upsert({
          where: { id: `anon-${host}` },
          update: { url },
          create: { id: `anon-${host}`, url, brand: brand ?? host },
        }).catch(async () => {
          // id-based upsert fallback if unique differs
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
