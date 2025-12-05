// app/api/integrations/google-business/profile/locations-count/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const externalConnectionId =
      url.searchParams.get("externalConnectionId")?.trim() || null;

    if (!externalConnectionId) {
      return NextResponse.json(
        { ok: false, error: "missing_external_connection_id" },
        { status: 400 },
      );
    }

    const count = await prisma.google_gbp_location.count({
      where: {
        external_connection_id: externalConnectionId,
      },
    });

    return NextResponse.json({ ok: true, count });
  } catch (err) {
    console.error("[GBP][locations-count] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "unexpected_error" },
      { status: 500 },
    );
  }
}
