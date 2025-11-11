// app/api/integrations/meta/facebook/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { cookies } from "next/headers";

const API_VERSION = process.env.META_GRAPH_API_VERSION || "v24.0";

async function getUserIdFromSession() {
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
  const { searchParams } = req.nextUrl;
  const origin = req.nextUrl.origin;

  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");
  const returnedState = searchParams.get("state");

  const jar = await cookies();
  const fbState = jar.get("fb_state")?.value || null;
  const fbCtxRaw = jar.get("fb_ctx")?.value || null;

  let returnTo = "/dashboard/integrations-test-2";
  let companyIdFromCtx: string | null = null;
  let userIdFromCtx: string | null = null;

  if (fbCtxRaw) {
    try {
      const parsed = JSON.parse(
        Buffer.from(fbCtxRaw, "base64url").toString("utf8")
      );
      if (parsed.returnTo) returnTo = parsed.returnTo;
      if (parsed.companyId) companyIdFromCtx = parsed.companyId;
      if (parsed.userId) userIdFromCtx = parsed.userId;
    } catch (e) {
      console.error("[META_CALLBACK] Error parsing fb_ctx:", e);
    }
  }

  if (error) {
    console.error("[META_CALLBACK] Meta error:", error, errorDesc);
    const base = process.env.META_BASE_URL || origin;
    return NextResponse.redirect(
      `${base}${returnTo}?error=${encodeURIComponent(String(error))}`
    );
  }

  if (!code) {
    console.error("[META_CALLBACK] Missing code");
    return new NextResponse("missing_code", { status: 400 });
  }

  if (fbState && returnedState && fbState !== returnedState) {
    console.error("[META_CALLBACK] Invalid state");
    return new NextResponse("invalid_state", { status: 400 });
  }

  const clientId = process.env.META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;
  const redirectUri = process.env.META_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return new NextResponse(
      "Meta OAuth misconfigured (META_APP_ID / META_APP_SECRET / META_REDIRECT_URI)",
      { status: 500 }
    );
  }

  try {
    // 1) Intercambiar code -> userAccessToken
    const tokenRes = await fetch(
      `https://graph.facebook.com/${API_VERSION}/oauth/access_token?` +
        new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          code,
        }),
      { method: "GET" }
    );

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      console.error("[META_CALLBACK] Token exchange failed:", txt);
      return new NextResponse("token_exchange_failed", { status: 400 });
    }

    const tokenData = await tokenRes.json();
    const userAccessToken = tokenData.access_token;
    if (!userAccessToken) {
      console.error("[META_CALLBACK] Missing user access token:", tokenData);
      return new NextResponse("missing_user_access_token", { status: 500 });
    }

    // 2) Obtener páginas
    const pagesRes = await fetch(
      `https://graph.facebook.com/${API_VERSION}/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`,
      { method: "GET" }
    );

    if (!pagesRes.ok) {
      const txt = await pagesRes.text();
      console.error("[META_CALLBACK] Fetch pages failed:", txt);
      return new NextResponse("fetch_pages_failed", { status: 400 });
    }

    const pagesData = await pagesRes.json();
    const page = pagesData?.data?.[0];
    if (!page) {
      console.warn("[META_CALLBACK] No pages found");
      return new NextResponse("no_pages", { status: 404 });
    }

    // 3) Resolver userId con prioridad: ctx -> sesión -> usuario de la compañía
    const companyId = companyIdFromCtx || null;

    let userId =
      userIdFromCtx ||
      (await getUserIdFromSession());

    if (!userId && companyId) {
      // fallback: cualquier usuario asociado a esa compañía
      const uc = await prisma.userCompany.findFirst({
        where: { companyId },
        select: { userId: true },
      });
      userId = uc?.userId || null;
    }

    if (!userId) {
      console.error("[META_CALLBACK] No userId (ctx + session + company fallback vacíos)");
      const base = process.env.META_BASE_URL || origin;
      return NextResponse.redirect(`${base}/login`);
    }

    console.log("[META_CALLBACK] Saving ExternalConnection:", {
      userId,
      companyId,
      pageId: page.id,
      pageName: page.name,
    });

    // 4) Guardar ExternalConnection
    const result = await prisma.externalConnection.upsert({
      where: {
        userId_provider: {
          userId,
          provider: "facebook",
        },
      },
      update: {
        access_token: page.access_token,
        accountName: page.name,
        providerUserId: page.id,
        companyId: companyId || undefined,
      },
      create: {
        userId,
        provider: "facebook",
        access_token: page.access_token,
        accountName: page.name,
        providerUserId: page.id,
        companyId: companyId || undefined,
      },
    });

    console.log("[META_CALLBACK] ExternalConnection saved:", {
      id: result.id,
      userId: result.userId,
      companyId: result.companyId,
      providerUserId: result.providerUserId,
    });

    // 5) Redirigir al dashboard
    const base = process.env.META_BASE_URL || origin;
    return NextResponse.redirect(`${base}${returnTo}?connected=facebook`);
  } catch (e) {
    console.error("[META_CALLBACK] Exception:", e);
    return new NextResponse("exception", { status: 500 });
  }
}
