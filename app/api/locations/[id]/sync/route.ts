// app/api/locations/[id]/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient, ReviewProvider } from "@prisma/client";
import { gbFetch, getGbAccountName } from "@/lib/googleBusiness";

const prisma = new PrismaClient();
const PROVIDER = ReviewProvider.GOOGLE;

type GReview = {
  reviewId: string;
  comment?: string;
  starRating?: "ONE" | "TWO" | "THREE" | "FOUR" | "FIVE";
  reviewer?: { displayName?: string; isAnonymous?: boolean };
  createTime?: string;
  updateTime?: string;
};

function toNumberRating(star?: GReview["starRating"]): number {
  const map: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  return star ? (map[star] ?? 0) : 0;
}

function mapToReviewRow(locId: string, r: GReview) {
  return {
    locationId: locId,
    externalId: r.reviewId,
    rating: toNumberRating(r.starRating),
    comment: r.comment ?? "",
    reviewerName: r.reviewer?.displayName ?? (r.reviewer?.isAnonymous ? "Anónimo" : "Usuario"),
    createdAtG: r.createTime ? new Date(r.createTime) : new Date(),
    ingestedAt: new Date(),
  };
}

/** Si falta googlePlaceId, lo resolvemos listando locations del account y lo guardamos. */
async function ensurePlaceIdForLocation(
  loc: { id: string; googlePlaceId: string | null; googleAccountId: string | null },
  userId: string
): Promise<string> {
  if (loc.googlePlaceId) return loc.googlePlaceId;

  let account = loc.googleAccountId || null;
  if (!account) account = getGbAccountName();

  const readMask = encodeURIComponent("name,locationKey.placeId,title");
  let pageToken = "";
  let found: any = null;

  for (let i = 0; i < 10; i++) {
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${account}/locations?readMask=${readMask}&pageSize=100${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await gbFetch(url, userId);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw Object.assign(new Error("g_list_locations_failed"), { code: "g_list_locations_failed", details: txt });
    }
    const json = await res.json();
    const locations: any[] = json.locations || [];
    found = locations.find(l => l?.locationKey?.placeId);
    if (found) break;
    pageToken = json.nextPageToken || "";
    if (!pageToken) break;
  }

  if (!found?.locationKey?.placeId) {
    throw Object.assign(new Error("no_place_id_found_in_google_account"), { code: "no_place_id_found_in_google_account" });
  }

  await prisma.location.update({
    where: { id: loc.id },
    data: {
      googleName: found.title || null,
      googlePlaceId: found.locationKey.placeId || null,
      googleAccountId: account,
      googleLocationId: found.name || null,
    },
  });

  return found.locationKey.placeId as string;
}

async function handleSync(req: NextRequest, id: string) {
  // 1) Sesión y userId
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
  }
  const me = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!me) return NextResponse.json({ ok: false, error: "no_user" }, { status: 404 });
  const userId = me.id;

  // 2) Location
  const loc = await prisma.location.findUnique({
    where: { id },
    select: { id: true, companyId: true, googlePlaceId: true, googleAccountId: true },
  });
  if (!loc) return NextResponse.json({ ok: false, error: "no_location" }, { status: 404 });

  // 3) MOCK (pruebas)
  if (process.env.GOOGLE_BUSINESS_MOCK === "1") {
    const fake: GReview[] = [
      {
        reviewId: "mock-1",
        comment: "Helado brutal. Volveré.",
        starRating: "FIVE",
        reviewer: { displayName: "Cliente A" },
        createTime: new Date(Date.now() - 864e5 * 4).toISOString(),
      },
      {
        reviewId: "mock-2",
        comment: "Buen trato, sitio limpio.",
        starRating: "FOUR",
        reviewer: { isAnonymous: true },
        createTime: new Date(Date.now() - 864e5 * 2).toISOString(),
      },
    ];
    let upserted = 0;
    for (const item of fake) {
      const row = mapToReviewRow(loc.id, item);
      await prisma.review.upsert({
        where: { provider_externalId: { provider: PROVIDER, externalId: row.externalId } },
        update: {
          rating: row.rating,
          comment: row.comment,
          reviewerName: row.reviewerName,
          createdAtG: row.createdAtG,
          ingestedAt: row.ingestedAt,
        },
        create: {
          companyId: loc.companyId,
          locationId: loc.id,
          provider: PROVIDER,
          externalId: row.externalId,
          rating: row.rating,
          comment: row.comment,
          reviewerName: row.reviewerName,
          createdAtG: row.createdAtG,
          ingestedAt: row.ingestedAt,
        },
      });
      upserted += 1;
    }

    // métricas
    const stats = await prisma.review.aggregate({
      where: { locationId: loc.id, provider: PROVIDER },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await prisma.location.update({
      where: { id: loc.id },
      data: {
        reviewsAvg: stats._avg.rating ? Number(stats._avg.rating.toFixed(2)) : 0,
        reviewsCount: stats._count._all,
        lastSyncAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      source: "MOCK",
      totalFromGoogle: fake.length,
      upserted,
      reviewsAvg: stats._avg.rating ?? 0,
      reviewsCount: stats._count._all,
    });
  }

  // 4) Asegurar placeId
  try {
    const placeIdNow = await ensurePlaceIdForLocation(
      { id: loc.id, googlePlaceId: loc.googlePlaceId ?? null, googleAccountId: loc.googleAccountId ?? null },
      userId
    );
    if (!loc.googlePlaceId) (loc as any).googlePlaceId = placeIdNow;
  } catch (e: any) {
    // si la cuenta está vacía, devolvemos éxito "vacío" para no romper la UI
    if (e?.code === "no_place_id_found_in_google_account") {
      await prisma.location.update({
        where: { id: loc.id },
        data: { lastSyncAt: new Date() },
      });
      return NextResponse.json({ ok: true, reason: "empty_google_account", totalFromGoogle: 0, upserted: 0 });
    }
    return NextResponse.json(
      { ok: false, error: "no_google_place_id", details: e?.code || String(e) },
      { status: 400 }
    );
  }

  // 5) Encontrar "accounts/.../locations/..." para reviews v4
  const account = loc.googleAccountId || getGbAccountName();
  const readMask = encodeURIComponent("name,locationKey.placeId,title");
  let pageToken = "";
  let foundLocationName: string | null = null;

  for (let i = 0; i < 10 && !foundLocationName; i++) {
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${account}/locations?readMask=${readMask}&pageSize=100${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await gbFetch(url, userId);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return NextResponse.json({ ok: false, error: "g_list_locations", details: txt }, { status: 502 });
    }
    const json = await res.json();
    const locations: any[] = json.locations ?? [];
    const match = locations.find(l => l?.locationKey?.placeId === (loc.googlePlaceId as string));
    if (match?.name) foundLocationName = match.name;
    pageToken = json.nextPageToken ?? "";
    if (!pageToken) break;
  }

  if (!foundLocationName) {
    await prisma.location.update({
      where: { id: loc.id },
      data: { lastSyncAt: new Date() },
    });
    return NextResponse.json(
      { ok: true, reason: "place_not_found_in_account", totalFromGoogle: 0, upserted: 0 }
    );
  }

  // 6) Reviews v4
  const reviewsUrl = `https://mybusiness.googleapis.com/v4/${foundLocationName}/reviews`;
  const rRes = await gbFetch(reviewsUrl, userId);
  if (!rRes.ok) {
    const txt = await rRes.text().catch(() => "");
    return NextResponse.json({ ok: false, error: "g_list_reviews", details: txt }, { status: 502 });
  }
  const rJson = await rRes.json();
  const items: GReview[] = rJson.reviews ?? [];

  // 7) Upsert
  let upserted = 0;
  for (const item of items) {
    const row = mapToReviewRow(loc.id, item);
    await prisma.review.upsert({
      where: { provider_externalId: { provider: PROVIDER, externalId: row.externalId } },
      update: {
        rating: row.rating,
        comment: row.comment,
        reviewerName: row.reviewerName,
        createdAtG: row.createdAtG,
        ingestedAt: row.ingestedAt,
      },
      create: {
        companyId: loc.companyId,
        locationId: loc.id,
        provider: PROVIDER,
        externalId: row.externalId,
        rating: row.rating,
        comment: row.comment,
        reviewerName: row.reviewerName,
        createdAtG: row.createdAtG,
        ingestedAt: row.ingestedAt,
      },
    });
    upserted += 1;
  }

  // 8) métricas
  const stats = await prisma.review.aggregate({
    where: { locationId: loc.id, provider: PROVIDER },
    _avg: { rating: true },
    _count: { _all: true },
  });

  await prisma.location.update({
    where: { id: loc.id },
    data: {
      reviewsAvg: stats._avg.rating ? Number(stats._avg.rating.toFixed(2)) : 0,
      reviewsCount: stats._count._all,
      lastSyncAt: new Date(),
    },
  });

  return NextResponse.json({
    ok: true,
    provider: PROVIDER,
    account,
    googleLocationName: foundLocationName,
    totalFromGoogle: items.length,
    upserted,
    reviewsAvg: stats._avg.rating ?? 0,
    reviewsCount: stats._count._all,
  });
}

// --- Handlers HTTP ---

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return NextResponse.json({ ok: true, message: "sync endpoint is alive", id });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleSync(req, id);
}
