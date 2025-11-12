// app/api/integrations/meta/facebook/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { cookies } from "next/headers";

const API_VERSION = process.env.META_GRAPH_API_VERSION || "v24.0";

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

  // ✅ Extraer directamente lo enviado desde el login
  let returnTo = "/dashboard/integrations-test-2";
  let companyId: string | null = null;
  let userId: string | null = null;
  let accountEmail: string | null = null;

  if (fbCtxRaw) {
    try {
      const parsed = JSON.parse(Buffer.from(fbCtxRaw, "base64url").toString("utf8"));
      if (parsed.returnTo) returnTo = parsed.returnTo;
      if (parsed.companyId) companyId = parsed.companyId;
      if (parsed.userId) userId = parsed.userId;
      if (parsed.accountEmail) accountEmail = parsed.accountEmail;
    } catch (e) {
      console.error("[META_CALLBACK] Error parsing fb_ctx:", e);
    }
  }

  const base = process.env.META_BASE_URL || origin;

  if (error) {
    console.error("[META_CALLBACK] Meta error:", error, errorDesc);
    return NextResponse.redirect(`${base}${returnTo}?error=${encodeURIComponent(String(error))}`);
  }

  if (!code) {
    console.error("[META_CALLBACK] Missing code");
    return NextResponse.redirect(`${base}${returnTo}?error=missing_code`);
  }

  if (fbState && returnedState && fbState !== returnedState) {
    console.error("[META_CALLBACK] Invalid state");
    return NextResponse.redirect(`${base}${returnTo}?error=invalid_state`);
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
    // 1️⃣ Intercambiar code → userAccessToken
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
      return NextResponse.redirect(`${base}${returnTo}?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();
    const userAccessToken = tokenData.access_token;
    if (!userAccessToken) {
      console.error("[META_CALLBACK] Missing user access token:", tokenData);
      return NextResponse.redirect(`${base}${returnTo}?error=missing_user_access_token`);
    }

    // 2️⃣ Obtener páginas (no bloqueante)
    let page: { id: string; name: string; access_token: string } | null = null;
    try {
      const pagesRes = await fetch(
        `https://graph.facebook.com/${API_VERSION}/me/accounts?fields=id,name,access_token&access_token=${userAccessToken}`,
        { method: "GET" }
      );

      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        page = pagesData?.data?.[0] ?? null;
      } else {
        const txt = await pagesRes.text();
        console.warn("[META_CALLBACK] Fetch pages failed (non-fatal):", txt);
      }
    } catch (e) {
      console.warn("[META_CALLBACK] Fetch pages exception (non-fatal):", e);
    }

    // 3️⃣ Guardar ExternalConnection si tenemos userId
    if (!userId) {
      console.error("[META_CALLBACK] Missing userId — nothing to save");
      return NextResponse.redirect(`${base}${returnTo}?error=missing_userid`);
    }

    const baseRecord = await prisma.externalConnection.upsert({
      where: {
        userId_provider: {
          userId,
          provider: "facebook",
        },
      },
      update: {
        access_token: userAccessToken,
        companyId: companyId || undefined,
        accountEmail: accountEmail || undefined,
      },
      create: {
        userId,
        provider: "facebook",
        access_token: userAccessToken,
        companyId: companyId || undefined,
        accountEmail: accountEmail || undefined,
      },
    });

    // 4️⃣ Si hay page → actualizar con datos de página
    if (page) {
      await prisma.externalConnection.update({
        where: { id: baseRecord.id },
        data: {
          access_token: page.access_token,
          accountName: page.name,
          providerUserId: page.id,
        },
      });
    }

    console.log("[META_CALLBACK] ExternalConnection saved:", {
      id: baseRecord.id,
      userId,
      companyId,
      accountEmail,
    });

    return NextResponse.redirect(`${base}${returnTo}?connected=facebook`);
  } catch (e) {
    console.error("[META_CALLBACK] Exception:", e);
    return NextResponse.redirect(`${base}${returnTo}?error=exception`);
  }
}
