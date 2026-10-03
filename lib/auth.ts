import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma, hasDatabase } from "@/lib/db";

const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Passwordless email magic link (needs SMTP). Optional in production.
if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM) {
  providers.push(
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    })
  );
}

export const authOptions: NextAuthOptions = {
  // fall back to stateless JWT (demo mode, no persistence).
  ...(hasDatabase ? { adapter: PrismaAdapter(prisma as any) as any } : {}),
  providers,
  session: { strategy: hasDatabase ? "database" : "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async session({ session, user, token }: any) {
      if (user) (session.user as any).id = user.id;
      if (token?.sub) (session.user as any).id = token.sub;
      return session;
    },
  },
};

export const authEnabled = providers.length > 0;
