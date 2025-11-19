// app/api/integrations/google/business-profile/connect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const url = new URL(req.url);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // URL del callback OAuth (fija o por env)
  const redirectUri =
    process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
    `${appUrl}/api/integrations/google/business-profile/callback`;

  // Fallback genérico si NO se pasa returnTo
  const defaultReturnTo =
    process.env.GOOGLE_BUSINESS_RETURN_URI ||
    `${appUrl}/dashboard/mybusiness`;

  // `returnTo` relativo o absoluto que pasa la página que llama
  const returnToParam = url.searchParams.get("returnTo");

  let returnTo = defaultReturnTo;
  if (returnToParam) {
    if (returnToParam.startsWith("/")) {
      // Ruta interna relativa → la convertimos en absoluta
      returnTo = `${appUrl}${returnToParam}`;
    } else if (
      returnToParam.startsWith("http://") ||
      returnToParam.startsWith("https://")
    ) {
      // Permite URLs absolutas explícitas si algún día lo necesitas
      returnTo = returnToParam;
    }
  }

  const companyId = url.searchParams.get("companyId") || null;
  const userId = (session?.user as any)?.id ?? null;
  const accountEmail = session?.user?.email ?? null;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_BUSINESS_CLIENT_ID!,
    process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
    redirectUri,
  );

  const scopes = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/business.manage",
  ];

  // Enviamos todos los datos necesarios en el state
  const state = JSON.stringify({
    redirect_after: returnTo, // 🔑 volveremos aquí en el callback
    companyId,
    userId,
    accountEmail,
  });

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state,
  });

  return NextResponse.redirect(authUrl);
}
