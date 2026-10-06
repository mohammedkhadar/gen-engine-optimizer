import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
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

// Email + password. Needs the database (Prisma) to store password hashes.
// Always registered: without a DB it fails closed with a clear message.
providers.push(
  CredentialsProvider({
    name: "Email & password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(creds) {
      const email = String(creds?.email ?? "").trim().toLowerCase();
      const password = String(creds?.password ?? "");
      if (!email || !password) throw new Error("Enter your email and password.");
      if (!hasDatabase) throw new Error("Email login needs a database — set DATABASE_URL first.");
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash) throw new Error("No password account for this email. Try Google sign-in, or register first.");
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) throw new Error("Wrong email or password.");
      return { id: user.id, email: user.email, name: user.name };
    },
  })
);

export const authOptions: NextAuthOptions = {
  // Use Prisma adapter only when a database is configured; otherwise
  // fall back to stateless JWT (demo mode, no persistence).
  ...(hasDatabase ? { adapter: PrismaAdapter(prisma as any) as any } : {}),
  providers,
  // Credentials requires JWT sessions (database sessions don't support it).
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) token.uid = (user as any).id ?? token.sub;
      return token;
    },
    async session({ session, token }: any) {
      if (token?.uid) (session.user as any).id = token.uid;
      else if (token?.sub) (session.user as any).id = token.sub;
      return session;
    },
  },
};

export const authEnabled = providers.length > 0;
export const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const passwordEnabled = hasDatabase;
