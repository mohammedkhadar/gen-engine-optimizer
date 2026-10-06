import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight guard: /dashboard/* requires sign-in only when auth is
// configured; otherwise demo mode stays open (zero-friction trial).
// The audit page stays public — it's the free entry funnel.
export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/dashboard/audit")) return NextResponse.next();
  const authConfigured =
    !!process.env.NEXTAUTH_SECRET &&
    (!!process.env.GOOGLE_CLIENT_ID || !!process.env.EMAIL_SERVER || !!process.env.DATABASE_URL);
  if (!authConfigured) return NextResponse.next();
  const session = req.cookies.get("next-auth.session-token") ?? req.cookies.get("__Secure-next-auth.session-token");
  if (!session && req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
