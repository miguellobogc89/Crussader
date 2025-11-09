// app/api/integrations/google/business-profile/locations/select/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = {
  companyId?: string;
  selectedIds?: string[];
};

export async function POST(req: Request) {
  try {
    const { companyId, selectedIds }: Body = await req.json();

    if (!companyId || !selectedIds || selectedIds.length === 0) {
      return NextResponse.json(
        { error: "companyId y selectedIds son requeridos" },
        { status: 400 },
      );
    }

    const provider = "GBP";

    const mappings: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        id,
        external_location_name,
        external_connection_id,
        company_id,
        place_id,
        title,
        address,
        primary_category,
        location_id
      FROM external_location_mapping
      WHERE provider = $1
        AND company_id = $2
        AND id = ANY($3::uuid[])
      `,
      provider,
      companyId,
      selectedIds,
    );

    if (!mappings || mappings.length === 0) {
      return NextResponse.json(
        { error: "No se han encontrado mappings para los IDs seleccionados" },
        { status: 404 },
      );
    }

    const linked: { mappingId: string; locationId: string; title: string }[] = [];

    for (const m of mappings) {
      let location = null;

      // 1) Si ya está enlazado, usar esa Location
      if (m.location_id) {
        location = await prisma.location.findUnique({
          where: { id: String(m.location_id) },
        });
      }

      // 2) Buscar por googleLocationId / googlePlaceId
      if (!location) {
        const or: any[] = [];
        if (m.external_location_name) {
          or.push({ googleLocationId: String(m.external_location_name) });
        }
        if (m.place_id) {
          or.push({ googlePlaceId: String(m.place_id) });
        }

        if (or.length) {
          location = await prisma.location.findFirst({
            where: {
              companyId,
              OR: or,
            },
          });
        }
      }

      // 3) Crear Location si no existe
      if (!location) {
        const parsed = roughParseAddress(m.address);

        // Solo usamos externalConnectionId si realmente existe
        let safeExternalConnectionId: string | undefined;
        if (m.external_connection_id) {
          const existingExt = await prisma.externalConnection
            .findUnique({
              where: { id: String(m.external_connection_id) },
            })
            .catch(() => null);
          if (existingExt) {
            safeExternalConnectionId = existingExt.id;
          }
        }

        location = await prisma.location.create({
          data: {
            companyId,
            title:
              m.title ||
              m.primary_category ||
              m.external_location_name ||
              "Establecimiento sin nombre",
            address: m.address || null,
            city: parsed.city,
            region: parsed.region,
            postalCode: parsed.postalCode,
            country: parsed.countryCode,
            googlePlaceId: m.place_id || null,
            googleLocationId: m.external_location_name || null,
            externalConnectionId: safeExternalConnectionId, // ahora seguro o undefined
            status: "ACTIVE",
          },
        });
      }

      // 4) Enlazar mapping -> location
      await prisma.$executeRawUnsafe(
        `
        UPDATE external_location_mapping
        SET location_id = $1,
            status = 'active'
        WHERE id = $2::uuid
        `,
        location.id,
        m.id,
      );

      linked.push({
        mappingId: String(m.id),
        locationId: String(location.id),
        title: location.title,
      });
    }

    return NextResponse.json({ ok: true, linked });
  } catch (error: any) {
    console.error("[GBP][locations/select] error", error);
    return NextResponse.json(
      {
        error: "Error interno al vincular ubicaciones",
        details: String(error?.message ?? ""),
      },
      { status: 500 },
    );
  }
}

/**
 * Parser sencillo de direcciones tipo:
 * "Calle X 1, Ciudad, 41001, ES"
 */
function roughParseAddress(address?: string | null) {
  if (!address) {
    return {
      city: null,
      region: null,
      postalCode: null,
      countryCode: null,
    };
  }

  const parts = address.split(",").map((p) => p.trim());
  const len = parts.length;

  let city: string | null = null;
  let region: string | null = null;
  let postalCode: string | null = null;
  let countryCode: string | null = null;

  if (len >= 3) {
    // Ejemplo: "... , Sevilla, 41001, ES"
    city = parts[len - 3] || null;
    const cpPart = parts[len - 2] || "";
    const cpMatch = cpPart.match(/(\d{4,6})/);
    postalCode = cpMatch ? cpMatch[1] : null;
    countryCode = (parts[len - 1] || "").slice(0, 2).toUpperCase() || null;
  }

  return { city, region, postalCode, countryCode };
}
