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

  /* 🔹 BLOQUE NUEVO: cookies dev/producción */
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  /* 🔹 FIN DEL BLOQUE NUEVO */

  providers: [
    // --- Credenciales (email + password) ---
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password)
          throw new Error("MISSING_CREDENTIALS");

        const email = creds.email.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        const ok =
          !!user?.passwordHash &&
          (await verifyPassword(creds.password, user.passwordHash));

        if (!user || !ok) {
          if (user?.id) {
            await prisma.userLogin.create({
              data: {
                userId: user.id,
                provider: "credentials",
                success: false,
                error: "BAD_CREDENTIALS",
              },
            });
          }
          throw new Error("BAD_CREDENTIALS");
        }

        if (user.isSuspended) throw new Error("ACCOUNT_SUSPENDED");
        if (!user.isActive) throw new Error("ACCOUNT_INACTIVE");
        if (!user.emailVerified) throw new Error("EMAIL_NOT_VERIFIED");

        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
            loginCount: { increment: 1 },
            failedLoginCount: 0,
          },
        });

        await prisma.userLogin.create({
          data: { userId: user.id, provider: "credentials", success: true },
        });

        return {
          id: user.id,
          name: user.name ?? "",
          email: user.email!,
          role: user.role,
        };
      },
    }),

    // --- Google OAuth ---
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: ["openid", "email", "profile"].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  // Página de login separada
  pages: {
    signIn: "/auth/login",
  },

  callbacks: {
    // 🔹 Lógica de alta/verificación con Google
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;

      const email = (user?.email || "").toLowerCase().trim();
      if (!email) return false;

      const emailVerifiedGoogle =
        (profile as any)?.email_verified === true ||
        (profile as any)?.email_verified === "true";

      const existing = await prisma.user.findUnique({ where: { email } });

      if (existing) {
        if (existing.isSuspended) return false;
        if (!existing.isActive) return false;

        if (emailVerifiedGoogle && !existing.emailVerified) {
          await prisma.user.update({
            where: { id: existing.id },
            data: { emailVerified: new Date() },
          });
        }
        return true;
      }

      await prisma.user.create({
        data: {
          email,
          name: user?.name ?? "",
          role: "user",
          isActive: true,
          isSuspended: false,
          emailVerified: emailVerifiedGoogle ? new Date() : null,
        },
      });

      return true;
    },

    // 🔹 Construir JWT
    async jwt({ token, user, account, profile }) {
      if (user && (user as any).role)
        (token as any).role = (user as any).role;
      if (!(token as any).role && token?.email) {
        (token as any).role =
          token.email === adminEmail ? "system_admin" : "user";
      }
      if (user && (user as any).id) (token as any).uid = (user as any).id;

      if (account?.provider === "google" && profile) {
        token.name = (profile as any).name ?? token.name;
        token.email = (profile as any).email ?? token.email;
        token.picture =
          (profile as any).picture ??
          (profile as any).avatar_url ??
          token.picture;
        token.sub = token.sub ?? (profile as any).sub;
      }

      if (account?.provider === "google") {
        (token as any).google_access_token = account.access_token;
        (token as any).google_refresh_token =
          account.refresh_token ?? (token as any).google_refresh_token;
        (token as any).google_expires_at = account.expires_at;
      }

      const exp = (token as any).google_expires_at as number | undefined;
      const needsRefresh = !!exp && Date.now() / 1000 > exp - 60;
      if (needsRefresh && (token as any).google_refresh_token) {
        try {
          const client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
          );
          client.setCredentials({
            refresh_token: (token as any).google_refresh_token,
          });

          const { credentials } = await client.refreshAccessToken();
          (token as any).google_access_token = credentials.access_token;
          (token as any).google_expires_at = credentials.expiry_date
            ? Math.floor(credentials.expiry_date / 1000)
            : undefined;
        } catch (e) {
          (token as any).google_token_error = "RefreshAccessTokenError";
        }
      }

      return token;
    },

    // 🔹 Propagar a session
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = (token as any).role || "user";
        if ((token as any).uid)
          (session.user as any).id = (token as any).uid;

        session.user.name = (token.name as string) ?? session.user.name;
        session.user.email = (token.email as string) ?? session.user.email;
        session.user.image = (token.picture as string) ?? session.user.image;
      }

      (session as any).googleAccessToken = (token as any).google_access_token;
      (session as any).googleTokenError = (token as any).google_token_error;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
