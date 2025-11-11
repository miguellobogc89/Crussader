// app/api/integrations/meta/facebook/login/route.ts
import { NextRequest, NextResponse } from "next/server";

const META_AUTH_URL = "https://www.facebook.com/v24.0/dialog/oauth";

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

  // 👇 viene de la card o del server
  const companyId = url.searchParams.get("companyId") || null;
  const userId = url.searchParams.get("userId") || null;

  const state = Math.random().toString(36).slice(2);

  const ctx = {
    returnTo,
    companyId,
    userId,
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
