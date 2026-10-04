import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma, hasDatabase } from "@/lib/db";
import { listAuditsLocal } from "@/lib/store";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  try {
    if (hasDatabase) {
      const session = await getServerSession(authOptions).catch(() => null);
      const ownerEmail = session?.user?.email ?? null;
      if (!ownerEmail) return NextResponse.json({ audits: [], source: "postgres" });
      const owner = await prisma.user.findUnique({ where: { email: ownerEmail } }).catch(() => null);
      if (!owner) return NextResponse.json({ audits: [], source: "postgres" });
      const audits = await prisma.audit.findMany({
        where: { domain: { userId: owner.id }, ...(url ? { url } : {}) },
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
