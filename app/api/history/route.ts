import { NextRequest, NextResponse } from "next/server";
import { prisma, hasDatabase } from "@/lib/db";
import { listAuditsLocal } from "@/lib/store";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  try {
    if (hasDatabase) {
      const audits = await prisma.audit.findMany({
        where: url ? { url } : {},
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return NextResponse.json({ audits, source: "postgres" });
    }
    return NextResponse.json({ audits: await listAuditsLocal(url ?? undefined), source: "local" });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
