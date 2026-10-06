import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma, hasDatabase } from "@/lib/db";

const Body = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().max(100).optional(),
});

// Self-serve registration for email+password sign-in. Passwords are stored
// as bcrypt hashes only — never plaintext, never returned.
export async function POST(req: NextRequest) {
  if (!hasDatabase) {
    return NextResponse.json({ error: "Registration needs a database — set DATABASE_URL first." }, { status: 503 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email and a password of 8+ characters." }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    return NextResponse.json({ error: "An account with this email already exists — sign in instead." }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash, name: parsed.data.name ?? existing.name } });
  } else {
    await prisma.user.create({ data: { email, name: parsed.data.name, passwordHash } });
  }
  return NextResponse.json({ ok: true });
}
