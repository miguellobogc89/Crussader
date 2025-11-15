// app/api/integrations/google/business-profile/locations/select/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const companyId = (body.companyId ?? "").trim();
    const selectedIds = Array.isArray(body.selectedIds)
      ? (body.selectedIds as string[])
      : [];

    if (!companyId) {
      return NextResponse.json(
        { error: "Falta companyId" },
        { status: 400 },
      );
    }

    if (selectedIds.length === 0) {
      return NextResponse.json(
        { error: "No hay ubicaciones seleccionadas" },
        { status: 400 },
      );
    }

    // 1) ExternalConnection de GBP para esta company
    const externalConn = await prisma.externalConnection.findFirst({
      where: {
        provider: "google-business",
        companyId,
      },
    });

    if (!externalConn) {
      return NextResponse.json(
        { error: "No hay conexión de Google Business para esta empresa" },
        { status: 400 },
      );
    }

    if (!externalConn.access_token) {
      return NextResponse.json(
        { error: "La conexión de Google Business no tiene access_token" },
        { status: 400 },
      );
    }

    // 2) google_gbp_account para esa conexión
    const gbpAccount = await prisma.google_gbp_account.findFirst({
      where: {
        company_id: companyId,
        external_connection_id: externalConn.id,
      },
    });

    if (!gbpAccount) {
      return NextResponse.json(
        {
          error:
            "No se ha encontrado la cuenta de Google Business (google_gbp_account) para esta empresa",
        },
        { status: 400 },
      );
    }

    // 🔑 AQUÍ está la clave:
    // account_id en google_gbp_location = gbpAccount.id (UUID), NO companyId
    const accountUuid = gbpAccount.id;

    // 3) Volvemos a leer las locations de Google y filtramos por las seleccionadas
    const readMask = [
      "name",
      "title",
      "storeCode",
      "metadata",
      "regularHours",
      "serviceArea",
      "websiteUri",
      "phoneNumbers",
      "languageCode",
    ].join(",");

    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${encodeURIComponent(
      gbpAccount.google_account_id,
    )}/locations?readMask=${encodeURIComponent(readMask)}`;

    const apiRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${externalConn.access_token}`,
      },
    });

    if (!apiRes.ok) {
      const text = await apiRes.text().catch(() => "");
      console.error("[GBP][select] fallo al leer locations de Google:", apiRes.status, text);
      return NextResponse.json(
        {
          error: "No se han podido leer las ubicaciones desde Google Business",
          status: apiRes.status,
        },
        { status: 502 },
      );
    }

    const apiJson: any = await apiRes.json();
    const apiLocations: any[] = Array.isArray(apiJson.locations)
      ? apiJson.locations
      : [];

    const selectedSet = new Set(selectedIds);

    // Nos quedamos solo con las locations cuyo name está en selectedIds
    const toLink = apiLocations.filter((loc) => {
      const name = typeof loc.name === "string" ? loc.name : "";
      return name && selectedSet.has(name);
    });

    const linkedIds: string[] = [];

    for (const loc of toLink) {
      const googleLocationName: string = loc.name; // p.ej: "locations/2386772236926619617"
      const googleLocationId: string = googleLocationName; // usamos el resource name completo

      const title: string | null = loc.title ?? null;
      const storeCode: string | null = loc.storeCode ?? null;
      const metadata: any = loc.metadata ?? null;
      const serviceArea: any = loc.serviceArea ?? null;
      const regularHours: any = loc.regularHours ?? null;
      const websiteUri: string | null = loc.websiteUri ?? null;

      const primaryPhone: string | null =
        loc.phoneNumbers && typeof loc.phoneNumbers.primaryPhone === "string"
          ? loc.phoneNumbers.primaryPhone
          : null;

      const regionCode: string | null = serviceArea?.regionCode ?? null;
      const placeName: string | null =
        serviceArea?.places?.placeInfos?.[0]?.placeName ?? null;

      const placeId: string | null =
        metadata?.placeId ??
        serviceArea?.places?.placeInfos?.[0]?.placeId ??
        null;

      const mapsUri: string | null = metadata?.mapsUri ?? null;
      const newReviewUri: string | null = metadata?.newReviewUri ?? null;
      const businessType: string | null = serviceArea?.businessType ?? null;

      // 4) Upsert en google_gbp_location (combinación company_id + google_location_id)
      const rec = await prisma.google_gbp_location.upsert({
        where: {
          company_id_google_location_id: {
            company_id: companyId,
            google_location_id: googleLocationId,
          },
        },
        create: {
          company_id: companyId,
          account_id: accountUuid,              // ✅ UUID correcto
          external_connection_id: externalConn.id,
          google_location_id: googleLocationId,
          google_location_title: title,
          google_place_id: placeId,
          address: placeName,
          raw_json: loc,
          status: "active",

          google_location_name: googleLocationName,
          store_code: storeCode,
          title,
          primary_phone: primaryPhone,
          website_uri: websiteUri,
          region_code: regionCode,
          language_code: loc.languageCode ?? null,
          place_id: placeId,
          maps_uri: mapsUri,
          new_review_uri: newReviewUri,
          business_type: businessType,
          service_area: serviceArea,
          regular_hours: regularHours,
          metadata,
        },
        update: {
          google_location_title: title,
          google_place_id: placeId,
          address: placeName,
          raw_json: loc,
          status: "active",

          google_location_name: googleLocationName,
          store_code: storeCode,
          title,
          primary_phone: primaryPhone,
          website_uri: websiteUri,
          region_code: regionCode,
          language_code: loc.languageCode ?? null,
          place_id: placeId,
          maps_uri: mapsUri,
          new_review_uri: newReviewUri,
          business_type: businessType,
          service_area: serviceArea,
          regular_hours: regularHours,
          metadata,
        },
      });

      linkedIds.push(rec.id);
    }

    return NextResponse.json(
      {
        ok: true,
        linkedCount: linkedIds.length,
        linked: linkedIds,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[GBP][locations/select] error", err);
    return NextResponse.json(
      {
        error: "Error interno al vincular ubicaciones",
        details: String(err),
      },
      { status: 500 },
    );
  }
}
