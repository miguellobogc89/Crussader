// app/api/integrations/google/business-profile/cron/refresh-reviews-all/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";

async function runRefreshAll(baseUrl: string, companyId?: string | null) {
  try {
    const locations = await prisma.location.findMany({
      where: {
        ...(companyId ? { companyId } : {}),
        google_gbp_location: {
          some: {
            is_active: true,
          },
        },
      },
      select: {
        id: true,
        companyId: true,
      },
    });

    if (locations.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "No hay locations con GBP activas para refrescar",
        totalLocations: 0,
      });
    }

    let successCount = 0;
    let errorCount = 0;
    const results: Array<{
      locationId: string;
      status: "ok" | "error";
      statusCode?: number;
      error?: string;
      synced?: unknown;
    }> = [];

    for (const loc of locations) {
      const url = `${baseUrl}/api/mybusiness/locations/${loc.id}/refresh-reviews`;

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: "cron_refresh_all" }),
        });

        if (!res.ok) {
          errorCount += 1;
          results.push({
            locationId: loc.id,
            status: "error",
            statusCode: res.status,
          });
          continue;
        }

        const data = await res.json().catch(() => null);
        successCount += 1;
        results.push({
          locationId: loc.id,
          status: "ok",
          synced: data?.synced ?? null,
        });
      } catch (err: any) {
        errorCount += 1;
        results.push({
          locationId: loc.id,
          status: "error",
          error: err?.message ?? String(err),
        });
      }
    }

    return NextResponse.json({
      ok: true,
      totalLocations: locations.length,
      successCount,
      errorCount,
      results,
    });
  } catch (err: any) {
    console.error("[gbp][cron][refresh-reviews-all] error", err);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        details: err?.message ?? String(err),
      },
      { status: 500 },
    );
  }
}

// Cron de Vercel puede entrar por GET (con ?companyId=...) o por POST (con JSON)
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const companyId = url.searchParams.get("companyId");
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || url.origin || "http://localhost:3000";

  return runRefreshAll(baseUrl, companyId);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const companyId = (body?.companyId as string | undefined)?.trim() || null;

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || "http://localhost:3000";

    return runRefreshAll(baseUrl, companyId);
  } catch (err: any) {
    console.error("[gbp][cron][refresh-reviews-all][POST] error", err);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        details: err?.message ?? String(err),
      },
      { status: 500 },
    );
  }
}
