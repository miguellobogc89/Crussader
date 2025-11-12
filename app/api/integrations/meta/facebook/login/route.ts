// app/api/integrations/meta/facebook/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/server/db";

const META_AUTH_URL = "https://www.facebook.com/v24.0/dialog/oauth";

// Fallback mínimo: resuelve userId desde la sesión de NextAuth si no llega por query
async function getUserIdFromSessionCookie() {
  const jar = await cookies();
  const sessionToken =
    jar.get("__Secure-next-auth.session-token")?.value ??
    jar.get("next-auth.session-token")?.value;
  if (!sessionToken) return null;

  const session = await prisma.session.findFirst({
    where: { sessionToken },
    select: { userId: true },
  });
  return session?.userId ?? null;
}

export async function GET(req: NextRequest) {
  const clientId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return new NextResponse(
      "Meta app not configured (META_APP_ID / META_REDIRECT_URI)",
      { status: 500 }
    );
  }

  const url = new URL(req.url);

  const returnTo =
    url.searchParams.get("returnTo") || "/dashboard/integrations-test-2";

  // 👇 vienen de la card
  const companyId = url.searchParams.get("companyId") || null;
  const accountEmail = url.searchParams.get("accountEmail") || null;

  // 👇 si no llega userId en la URL, lo resolvemos desde la sesión
  const userIdFromQuery = url.searchParams.get("userId");
  const userId =
    (userIdFromQuery && userIdFromQuery.length > 0 ? userIdFromQuery : null) ||
    (await getUserIdFromSessionCookie());

  const state = Math.random().toString(36).slice(2);

  const ctx = {
    returnTo,
    companyId,
    userId,
    accountEmail, // ✅ añadido: también se pasa por el contexto
  };

  const ctxB64 = Buffer.from(JSON.stringify(ctx), "utf8").toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    auth_type: "rerequest",
    scope:
      "pages_show_list,pages_read_engagement,pages_manage_metadata,pages_manage_engagement,business_management",
    state,
  });

  const res = NextResponse.redirect(`${META_AUTH_URL}?${params.toString()}`);

  res.cookies.set("fb_state", state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  res.cookies.set("fb_ctx", ctxB64, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
