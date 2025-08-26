import NextAuth, { type NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ⛔️ SIN PrismaAdapter
// ⛔️ SIN callbacks

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: { signIn: "/auth" },
  callbacks: {
    async jwt({ token }) {
      const adminEmail = "miguel.lobogc.89@gmail.com";
      // ts-expect-error — NextAuth types mismatch in App Router, runtime-validated
      token.role = token?.email === adminEmail ? "system_admin" : "user";
      return token;
    },
    async session({ session, token }) {
      // @ts-expect-error — Adapter/session types are runtime-validated here
      session.user.role = token.role || "user";
      return session;
    },
  },
};



const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
