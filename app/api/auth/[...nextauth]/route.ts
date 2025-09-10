// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const adminEmail = "miguel.lobogc.89@gmail.com";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    // --- Credenciales (email + passwordHash) ---
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) throw new Error("MISSING_CREDENTIALS");

        const user = await prisma.user.findUnique({ where: { email: creds.email } });
        const ok = !!user?.passwordHash && (await verifyPassword(creds.password, user.passwordHash));
        if (!user || !ok) {
          await prisma.userLogin.create({
            data: { userId: user?.id, provider: "credentials", success: false, error: "BAD_CREDENTIALS" },
          });
          throw new Error("BAD_CREDENTIALS");
        }

        if (user.isSuspended) throw new Error("ACCOUNT_SUSPENDED");
        if (!user.isActive) throw new Error("ACCOUNT_INACTIVE");
        if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date(), loginCount: { increment: 1 }, failedLoginCount: 0 },
        });
        await prisma.userLogin.create({
          data: { userId: user.id, provider: "credentials", success: true },
        });

        // Pasamos también el role para setearlo en el JWT
        return { id: user.id, name: user.name ?? "", email: user.email!, role: user.role };
      },
    }),

    // --- Google OAuth (opcional) ---
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  pages: { signIn: "/auth" },

  callbacks: {
    // Se ejecuta en cualquier proveedor
    async signIn({ user, account }) {
      // Alta/actualización suave para Google
      if (account?.provider === "google" && user?.email) {
        const isAdmin = user.email === adminEmail;
        await prisma.user.upsert({
          where: { email: user.email },
          create: {
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
            role: isAdmin ? "system_admin" : "user",
            emailVerified: new Date(), // damos por verificado via Google
          },
          update: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
            ...(isAdmin ? { role: "system_admin" } : {}), // no degradar admins
            emailVerified: { set: new Date() },
          },
        });

        // Auditoría de login Google (éxito)
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { lastLoginAt: new Date(), loginCount: { increment: 1 }, failedLoginCount: 0 },
          });
          await prisma.userLogin.create({
            data: { userId: dbUser.id, provider: "google", success: true },
          });
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      // A) Si venimos de sign-in con Credentials y devolvimos role, cógelo
      if (user && (user as any).role) {
        (token as any).role = (user as any).role;
      }
      // B) Si no hay role aún, mantenemos tu lógica de admin por email
      if (!(token as any).role && token?.email) {
        (token as any).role = token.email === adminEmail ? "system_admin" : "user";
      }
      // id de usuario para session
      if (user && (user as any).id) (token as any).uid = (user as any).id;
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = (token as any).role || "user";
        if ((token as any).uid) (session.user as any).id = (token as any).uid;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
