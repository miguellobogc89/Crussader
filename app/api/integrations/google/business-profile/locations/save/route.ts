// app/api/integrations/google/business-profile/locations/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const companyId = body?.companyId;
    const accountId = body?.accountId;                     // google_gbp_account.id
    const externalConnectionId = body?.externalConnectionId;
    const locations = body?.locations;

    if (!companyId || !accountId || !externalConnectionId) {
      return NextResponse.json(
        { ok: false, error: "missing_parameters" },
        { status: 400 }
      );
    }

    if (!Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        { ok: false, error: "no_locations_provided" },
        { status: 400 }
      );
    }

    // Validación mínima
    const account = await prisma.$queryRaw`
      SELECT id FROM google_gbp_account WHERE id = ${accountId} LIMIT 1;
    `;

    if (!account || (Array.isArray(account) && account.length === 0)) {
      return NextResponse.json(
        { ok: false, error: "invalid_account_id" },
        { status: 404 }
      );
    }

    // Guardado en batch
    for (const loc of locations) {
      const googleLocationId = loc.id; // "accounts/.../locations/..."

      if (!googleLocationId) continue;

      await prisma.$executeRawUnsafe(`
        INSERT INTO google_gbp_location (
          company_id,
          account_id,
          external_connection_id,
          google_location_id,
          google_location_title,
          google_place_id,
          address,
          raw_json,
          status
        )
        VALUES (
          '${companyId}',
          '${accountId}',
          '${externalConnectionId}',
          '${googleLocationId}',
          ${loc.title ? `'${loc.title.replace(/'/g, "''")}'` : "NULL"},
          ${loc.googlePlaceId ? `'${loc.googlePlaceId}'` : "NULL"},
          ${loc.address ? `'${loc.address.replace(/'/g, "''")}'` : "NULL"},
          '${JSON.stringify(loc).replace(/'/g, "''")}'::jsonb,
          'active'
        )
        ON CONFLICT (company_id, google_location_id) DO NOTHING;
      `);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[GBP] save locations error:", err);
    return NextResponse.json(
      { ok: false, error: "unexpected_error" },
      { status: 500 }
    );
  }
}
