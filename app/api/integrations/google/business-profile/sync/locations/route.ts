// app/api/integrations/google/business-profile/sync/locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type GbpLocationWire = {
  id: string;
  externalLocationName?: string;
  title?: string;
  address?: string;
  rating?: number | string;
  totalReviewCount?: number;
  status?: "available" | "active" | "pending_upgrade" | "blocked";
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const companyId = (body?.companyId ?? "").trim();

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "missing_company_id" },
        { status: 400 },
      );
    }

    // 1) ExternalConnection de GBP para esta company (igual que en select)
    const externalConn = await prisma.externalConnection.findFirst({
      where: {
        provider: "google-business",
        companyId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!externalConn) {
      return NextResponse.json(
        { ok: false, error: "no_external_connection_for_company" },
        { status: 404 },
      );
    }

    if (!externalConn.access_token) {
      return NextResponse.json(
        {
          ok: false,
          error: "external_connection_missing_access_token",
        },
        { status: 400 },
      );
    }

    // 2) google_gbp_account para esa conexión (igual que en select)
    const gbpAccount = await prisma.google_gbp_account.findFirst({
      where: {
        company_id: companyId,
        external_connection_id: externalConn.id,
      },
      orderBy: { created_at: "desc" },
    });

    if (!gbpAccount) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "no_gbp_account_for_company_and_connection",
        },
        { status: 404 },
      );
    }

    const accountUuid = gbpAccount.id;

    // 3) Llamada a Business Information v1 para locations
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

    const accountId = gbpAccount.google_account_id.trim();
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${encodeURIComponent(
      accountId,
    )}/locations?readMask=${encodeURIComponent(readMask)}`;

    const apiRes = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${externalConn.access_token}`,
      },
    });

    if (!apiRes.ok) {
      const text = await apiRes.text().catch(() => "");
      console.error("[GBP][sync/locations] Google API error", apiRes.status, text);
      return NextResponse.json(
        {
          ok: false,
          error: "google_api_error",
          status: apiRes.status,
          message: text || undefined,
        },
        { status: 502 },
      );
    }

    const apiJson: any = await apiRes.json();
    const apiLocations: any[] = Array.isArray(apiJson.locations)
      ? apiJson.locations
      : [];

    // 4) Upsert de TODAS las locations en google_gbp_location
    const upserted = await prisma.$transaction(async (tx) => {
      const results: Array<{ google_location_id: string } | null> = [];

      for (const loc of apiLocations) {
        const googleLocationName: string =
          typeof loc.name === "string" ? loc.name : "";
        if (!googleLocationName) {
          results.push(null);
          continue;
        }

        // Aquí en select usabas el resource completo como ID
        const googleLocationId: string = googleLocationName;

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

        const record = await tx.google_gbp_location.upsert({
          where: {
            company_id_google_location_id: {
              company_id: companyId,
              google_location_id: googleLocationId,
            },
          },
          create: {
            company_id: companyId,
            account_id: accountUuid,
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

        results.push({ google_location_id: record.google_location_id });
      }

      return results;
    });

    const upsertedCount = upserted.filter(Boolean).length;

    // 5) Respuesta para el modal: mapeo a GbpLocationWire
    const locations: GbpLocationWire[] = apiLocations.map((loc: any) => {
      const name: string = typeof loc.name === "string" ? loc.name : "";
      const title: string =
        typeof loc.title === "string"
          ? loc.title
          : typeof loc.locationName === "string"
          ? loc.locationName
          : "Sin nombre";

      let address = "";
      const storefront =
        loc.storefrontAddress ?? loc.locationAddress ?? loc.address;

      if (storefront) {
        const parts: string[] = [];

        if (Array.isArray(storefront.addressLines)) {
          parts.push(...storefront.addressLines);
        }
        if (storefront.postalCode) parts.push(storefront.postalCode);
        if (storefront.locality) parts.push(storefront.locality);
        if (storefront.administrativeArea) {
          parts.push(storefront.administrativeArea);
        }
        if (storefront.countryCode) parts.push(storefront.countryCode);

        address = parts.filter(Boolean).join(", ");
      }

      if (!address) {
        const placeName =
          loc?.serviceArea?.places?.placeInfos?.[0]?.placeName ?? null;
        if (placeName) address = placeName;
      }

      return {
        id: name || "",
        externalLocationName: name || "",
        title,
        address,
        rating: undefined,
        totalReviewCount: undefined,
        status: "available",
      };
    });

    const maxConnectable = 1; // de momento 1, luego lo ligamos al plan

    return NextResponse.json({
      ok: true,
      locations,
      maxConnectable,
      synced: {
        totalFromGoogle: apiLocations.length,
        upserted: upsertedCount,
      },
    });
  } catch (err) {
    console.error("[GBP][sync/locations] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "unexpected_error" },
      { status: 500 },
    );
  }
}
