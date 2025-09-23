// app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/hash";
import { google } from "googleapis";

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
      authorization: {
        params: {
          // scopes mínimos y suficientes para listar calendarios y crear/leer eventos
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
          ].join(" "),
          // imprescindible para obtener refresh_token persistente
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  pages: { signIn: "/auth" },

  callbacks: {
    async signIn({ user, account }) {
      // ... (tu lógica existente tal cual)
      return true;
    },

    async jwt({ token, user, account }) {
      // ====== lo tuyo (roles/uid) ======
      if (user && (user as any).role) (token as any).role = (user as any).role;
      if (!(token as any).role && token?.email) {
        (token as any).role = token.email === adminEmail ? "system_admin" : "user";
      }
      if (user && (user as any).id) (token as any).uid = (user as any).id;

      // ====== NUEVO: guardar tokens de Google al conectar ======
      if (account?.provider === "google") {
        (token as any).google_access_token = account.access_token;
        (token as any).google_refresh_token = account.refresh_token ?? (token as any).google_refresh_token;
        (token as any).google_expires_at = account.expires_at; // epoch (s)
      }

      // ====== NUEVO: refrescar access_token cuando falte ~1 min ======
      const exp = (token as any).google_expires_at as number | undefined;
      const needsRefresh = !!exp && Date.now() / 1000 > exp - 60;
      if (needsRefresh && (token as any).google_refresh_token) {
        try {
          const client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
          );
          client.setCredentials({ refresh_token: (token as any).google_refresh_token });

          const { credentials } = await client.refreshAccessToken();
          (token as any).google_access_token = credentials.access_token;
          (token as any).google_expires_at = credentials.expiry_date
            ? Math.floor(credentials.expiry_date / 1000)
            : undefined;
        } catch (e) {
          // marca error (si quieres forzar re-login, lo podrás leer en session)
          (token as any).google_token_error = "RefreshAccessTokenError";
        }
      }

      return token;
    },

    async session({ session, token }) {
      // lo tuyo
      if (session.user) {
        (session.user as any).role = (token as any).role || "user";
        if ((token as any).uid) (session.user as any).id = (token as any).uid;
      }
      // NUEVO: expón el access token para usarlo en rutas server-side
      (session as any).googleAccessToken = (token as any).google_access_token;
      (session as any).googleTokenError = (token as any).google_token_error;
      return session;
    },
  },

};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
