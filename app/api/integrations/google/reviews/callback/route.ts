// app/api/integrations/google/reviews/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { gbFetch, getGbAccountName } from "@/lib/googleBusiness";

const prisma = new PrismaClient();

const CLIENT_ID = process.env.GOOGLE_BUSINESS_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_BUSINESS_CLIENT_SECRET!;
const REDIRECT_URI =
  process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
  `${process.env.NEXTAUTH_URL}/api/connect/google-business/callback`;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code)
    return NextResponse.redirect(new URL("/dashboard?connected=fail_missing_code", req.url));
  if (!state)
    return NextResponse.redirect(new URL("/dashboard?connected=fail_missing_state", req.url));

  // validar state con cookie
  const cookieState = req.cookies.get("gb_state")?.value;
  if (!cookieState || cookieState !== state) {
    return NextResponse.redirect(new URL("/dashboard?connected=fail_bad_state", req.url));
  }

  // recuperar contexto (locationId, returnTo)
  const ctxRaw = req.cookies.get("gb_ctx")?.value ?? "";
  let ctx = { locationId: "", returnTo: "/dashboard/company" };
  try {
    const parsed = JSON.parse(Buffer.from(ctxRaw, "base64url").toString("utf8"));
    if (typeof parsed?.locationId === "string") ctx.locationId = parsed.locationId;
    if (typeof parsed?.returnTo === "string") ctx.returnTo = parsed.returnTo;
  } catch {}

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL("/auth?tab=login&error=not_authenticated", req.url));
  }

  // Intercambio code -> tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const dbgText = await tokenRes.text().catch(() => "");
    const q = new URLSearchParams({
      connected: "fail_token",
      status: String(tokenRes.status),
      google: dbgText.slice(0, 500),
    });
    return NextResponse.redirect(new URL(`/dashboard?${q.toString()}`, req.url));
  }

  const tokenJson: {
    access_token: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
    id_token?: string;
  } = await tokenRes.json();

  const expires_at = tokenJson.expires_in
    ? Math.floor(Date.now() / 1000) + tokenJson.expires_in
    : null;

  // Perfil (email) para mostrarlo en la UI
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenJson.access_token}` },
  });
  const profile = profileRes.ok ? await profileRes.json() : {};
  const accountEmail = typeof profile?.email === "string" ? profile.email : null;

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!dbUser) {
    return NextResponse.redirect(new URL("/dashboard?connected=fail_user", req.url));
  }

  // Guardar/actualizar conexión externa
  const extConn = await prisma.externalConnection.upsert({
    where: { userId_provider: { userId: dbUser.id, provider: "google-business" } },
    update: {
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token ?? null,
      expires_at: expires_at ?? null,
      accountEmail,
    },
    create: {
      userId: dbUser.id,
      provider: "google-business",
      accountEmail,
      access_token: tokenJson.access_token,
      refresh_token: tokenJson.refresh_token ?? null,
      expires_at: expires_at ?? null,
    },
  });

  // SIEMPRE enlazamos la Location con la ExternalConnection (aunque no haya locations en Google)
  if (ctx.locationId) {
    await prisma.location.update({
      where: { id: ctx.locationId },
      data: { externalConnectionId: extConn.id },
    });

    // Intentamos rellenar campos google* si la cuenta tiene locations
    try {
      const account = getGbAccountName();
      const readMask = encodeURIComponent("name,locationKey.placeId,title");
      let pageToken = "";
      let match: any = null;

      for (let i = 0; i < 10 && !match; i++) {
        const urlList = `https://mybusinessbusinessinformation.googleapis.com/v1/${account}/locations?readMask=${readMask}&pageSize=100${
          pageToken ? `&pageToken=${pageToken}` : ""
        }`;
        const locRes = await gbFetch(urlList, dbUser.id);
        if (!locRes.ok) break;
        const json = await locRes.json();
        const locations: any[] = json.locations ?? [];
        match = locations.find((l) => l?.locationKey?.placeId) ?? locations[0];
        pageToken = json.nextPageToken ?? "";
        if (!pageToken) break;
      }

      if (match) {
        await prisma.location.update({
          where: { id: ctx.locationId },
          data: {
            googleName: match.title ?? null,
            googlePlaceId: match.locationKey?.placeId ?? null,
            googleAccountId: getGbAccountName(),
            googleLocationId: match.name ?? null, // "accounts/.../locations/..."
          },
        });
      }
    } catch (e) {
      console.error("Error updating Location with Google fields:", e);
    }
  }

  // Limpieza de cookies efímeras y redirect
  const res = NextResponse.redirect(new URL(ctx.returnTo || "/dashboard/company", req.url));
  res.cookies.set("gb_state", "", { path: "/", maxAge: 0 });
  res.cookies.set("gb_ctx", "", { path: "/", maxAge: 0 });
  return res;
}
