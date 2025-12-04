// app/api/integrations/google/business-profile/cron/refresh-reviews-all/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const companyId = (body?.companyId as string | undefined)?.trim();

    // 1) Locations con GBP linkado (y opcionalmente filtradas por companyId)
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

    // 2) Base URL para llamar al endpoint existente de refresh por location
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin || "http://localhost:3000";

    let successCount = 0;
    let errorCount = 0;
    const results: Array<{
      locationId: string;
      status: "ok" | "error";
      statusCode?: number;
      error?: string;
      synced?: unknown;
    }> = [];

    // 3) Recorrer locations y llamar a tu endpoint actual de refresh
    for (const loc of locations) {
      const url = `${baseUrl}/api/mybusiness/locations/${loc.id}/refresh-reviews`;

      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // Puedes usar este body para diferenciar en logs que viene de cron
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

// 👇 Añadido para que el cron de Vercel (GET) reutilice la misma lógica
export async function GET(req: NextRequest) {
  return POST(req);
}
