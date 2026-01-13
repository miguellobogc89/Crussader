// app/connect/_server/gbp/locations.ts
import { prisma } from "@/app/server/db";

function extractGoogleLocationId(locationName: string) {
  // "locations/9222173624270802883" -> "9222173624270802883"
  const parts = locationName.split("/");
  return parts.length >= 2 ? parts[1] : locationName;
}

export async function ensureLocations(params: {
  companyId: string;
  googleAccountId: string; // string (numérico normalmente)
  gbpAccountId: string; // uuid de google_gbp_account.id
  externalConnectionId: string;
  locations: Array<{ name?: unknown; title?: unknown }>;
}) {
  const results = {
    gbpLocationsCreated: 0,
    gbpLocationsExisting: 0,
    locationsCreated: 0,
    locationsExisting: 0,
  };

  for (const loc of params.locations) {
    const name = typeof loc?.name === "string" ? loc.name : null;
    const title = typeof loc?.title === "string" ? loc.title : null;
    if (!name) continue;

    const googleLocationId = extractGoogleLocationId(name);

    // 1) google_gbp_location (raw)
    const existingGbpLoc = await prisma.google_gbp_location.findFirst({
      where: {
        company_id: params.companyId,
        google_location_id: googleLocationId,
      },
      select: { id: true, location_id: true },
    });

    let gbpLocId: string;

    if (existingGbpLoc) {
      results.gbpLocationsExisting += 1;
      gbpLocId = existingGbpLoc.id;
    } else {
      const createdGbpLoc = await prisma.google_gbp_location.create({
        data: {
          company_id: params.companyId,
          account_id: params.gbpAccountId,
          external_connection_id: params.externalConnectionId,
          google_location_id: googleLocationId,
          google_location_title: title,
          raw_json: {
            name,
            title,
          },
          status: "active",
          google_location_name: name,
          title,
        },
        select: { id: true },
      });

      results.gbpLocationsCreated += 1;
      gbpLocId = createdGbpLoc.id;
    }

    // 2) Location interna (si no existe)
    const existingLocation = await prisma.location.findFirst({
      where: {
        companyId: params.companyId,
        googleAccountId: params.googleAccountId,
        googleLocationId: googleLocationId,
      },
      select: { id: true },
    });

    if (existingLocation) {
      results.locationsExisting += 1;
      continue;
    }

    const createdLocation = await prisma.location.create({
      data: {
        companyId: params.companyId,
        title: title || "Sin título",
        googleAccountId: params.googleAccountId,
        googleLocationId: googleLocationId,
        googleName: name,
        externalConnectionId: params.externalConnectionId,
      },
      select: { id: true },
    });

    results.locationsCreated += 1;

    // 3) Vincular google_gbp_location -> Location (solo si el gbp_loc no tenía location_id)
    // No hacemos update si ya está vinculado.
    const gbpLocAfter = await prisma.google_gbp_location.findUnique({
      where: { id: gbpLocId },
      select: { location_id: true },
    });

    if (!gbpLocAfter?.location_id) {
      await prisma.google_gbp_location.update({
        where: { id: gbpLocId },
        data: { location_id: createdLocation.id, is_active: true },
      });
    }
  }

  return results;
}
