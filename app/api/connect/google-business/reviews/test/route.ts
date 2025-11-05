// app/api/connect/google-business/reviews/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import { errorMessage } from "@/lib/error-message";


const prisma = new PrismaClient();
const MOCK_MODE = process.env.GOOGLE_BUSINESS_MOCK === "1";

// IMPORTANTE: Para modo real, esta API usa el endpoint v4 antiguo:
//   GET https://mybusiness.googleapis.com/v4/{locationName}/reviews
// name = "accounts/{ACCOUNT_ID}/locations/{LOCATION_ID}"
// Nota: con tus cuotas a 0, funcionará solo con MOCK_MODE=1 hasta que Google apruebe.

async function refreshAccessToken(refresh_token: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_BUSINESS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
      refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Refresh failed: ${JSON.stringify(json)}`);
  return {
    access_token: json.access_token as string,
    expires_at: json.expires_in ? Math.floor(Date.now() / 1000) + Number(json.expires_in) : undefined,
  };
}

async function fetchGoogleJSON(url: string, access_token: string) {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${access_token}` }, cache: "no-store" });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

export async function GET(req: NextRequest) {
  try {
    // 0) Mock directo para poder trabajar hoy
    if (MOCK_MODE) {
      const sample = [
        {
          reviewId: "r1",
          reviewer: { displayName: "Juan Pérez" },
          starRating: 5,
          comment: "Excelente servicio",
          createTime: "2025-08-01T10:00:00Z",
          updateTime: "2025-08-01T10:00:00Z",
        },
        {
          reviewId: "r2",
          reviewer: { displayName: "Ana López" },
          starRating: 4,
          comment: "Muy bien todo",
          createTime: "2025-08-02T18:30:00Z",
          updateTime: "2025-08-02T18:45:00Z",
        },
      ];
      return NextResponse.json({ ok: true, mode: "mock", count: sample.length, reviews: sample });
    }

    // 1) Usuario y conexión
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ ok: false, error: "not_logged_in" }, { status: 401 });
    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ ok: false, error: "user_not_found" }, { status: 404 });

    let conn = await prisma.externalConnection.findUnique({
      where: { userId_provider: { userId: user.id, provider: "google-business" } },
    });
    if (!conn) return NextResponse.json({ ok: false, error: "no_external_connection" }, { status: 404 });

    // 2) Refresh si hace falta
    const now = Math.floor(Date.now() / 1000);
    if ((conn.expires_at ?? 0) < now + 60 && conn.refresh_token) {
      const refreshed = await refreshAccessToken(conn.refresh_token);
      conn = await prisma.externalConnection.update({
        where: { userId_provider: { userId: user.id, provider: "google-business" } },
        data: { access_token: refreshed.access_token, expires_at: refreshed.expires_at },
      });
    }

    // 3) Tomar el locationName desde query o .env (parent fijo + LOCATION_ID)
    const url = new URL(req.url);
    const qLocation = url.searchParams.get("location"); // ej: accounts/XXX/locations/YYY
    const envAccount = process.env.GOOGLE_BUSINESS_ACCOUNT_NAME; // ej: accounts/XXX
    const envLocation = process.env.GOOGLE_BUSINESS_LOCATION_ID; // ej: YYY

    const locationName =
      qLocation ??
      (envAccount && envLocation ? `${envAccount}/locations/${envLocation}` : null);

    if (!locationName) {
      return NextResponse.json(
        { ok: false, error: "missing_location", help: "Pass ?location=accounts/{A}/locations/{L} or set GOOGLE_BUSINESS_ACCOUNT_NAME and GOOGLE_BUSINESS_LOCATION_ID in .env.local" },
        { status: 400 }
      );
    }

    // 4) Reviews (API v4 antigua)
    const pageSize = url.searchParams.get("pageSize") ?? "100";
    const pageToken = url.searchParams.get("pageToken") ?? "";
    const reviewsURL =
      `https://mybusiness.googleapis.com/v4/${locationName}/reviews?pageSize=${encodeURIComponent(pageSize)}` +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "");

    let r = await fetchGoogleJSON(reviewsURL, conn.access_token);

    // Reintento con refresh si 401
    if (!r.ok && r.status === 401 && conn.refresh_token) {
      const refreshed = await refreshAccessToken(conn.refresh_token);
      conn = await prisma.externalConnection.update({
        where: { userId_provider: { userId: user.id, provider: "google-business" } },
        data: { access_token: refreshed.access_token, expires_at: refreshed.expires_at },
      });
      r = await fetchGoogleJSON(reviewsURL, conn.access_token);
    }

    if (!r.ok) {
      return NextResponse.json({ ok: false, step: "reviews", error: r.body }, { status: r.status });
    }

    const reviews = Array.isArray(r.body.reviews) ? r.body.reviews : [];
    return NextResponse.json({
      ok: true,
      mode: "real",
      location: locationName,
      count: reviews.length,
      nextPageToken: r.body.nextPageToken ?? null,
      reviews,
    });
  } catch (e: unknown) {
    console.error("[GB reviews test] ", e);
    return NextResponse.json(
      { ok: false, error: "internal_error", message: errorMessage(e) },
      { status: 500 },
    );
  }

}
