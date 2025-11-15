// app/api/integrations/google/business-profile/sync/locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
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
    const companyId = (body?.companyId as string | undefined)?.trim();

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "missing_company_id" },
        { status: 400 },
      );
    }

    const provider = "google-business";

    // 1) ExternalConnection de GOOGLE BUSINESS para esa company
    const ext = await prisma.externalConnection.findFirst({
      where: {
        companyId,
        provider,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!ext) {
      return NextResponse.json(
        { ok: false, error: "no_external_connection" },
        { status: 404 },
      );
    }

    if (!ext.access_token && !ext.refresh_token) {
      return NextResponse.json(
        { ok: false, error: "no_tokens_for_connection" },
        { status: 400 },
      );
    }

    // 2) Buscar la cuenta GBP asociada a esa ExternalConnection
    const gbpAccounts = await prisma.$queryRaw<
      {
        id: string;
        company_id: string;
        external_connection_id: string;
        google_account_id: string;
        google_account_name: string | null;
      }[]
    >`SELECT id, company_id, external_connection_id, google_account_id, google_account_name
      FROM google_gbp_account
      WHERE external_connection_id = ${ext.id}
      ORDER BY created_at DESC
      LIMIT 1`;

    if (!gbpAccounts || gbpAccounts.length === 0) {
      return NextResponse.json(
        { ok: false, error: "no_gbp_account_for_connection" },
        { status: 404 },
      );
    }

    const gbpAccount = gbpAccounts[0];

    // Puede que hayas guardado "1181414..." o "accounts/1181414..."
    let googleAccountName = gbpAccount.google_account_id?.trim();
    if (!googleAccountName) {
      return NextResponse.json(
        { ok: false, error: "invalid_gbp_account_id" },
        { status: 500 },
      );
    }
    if (!googleAccountName.startsWith("accounts/")) {
      googleAccountName = `accounts/${googleAccountName}`;
    }

    // 3) Resolver access_token válido (con refresh si hace falta)
    const redirectUri =
      process.env.GOOGLE_BUSINESS_REDIRECT_URI ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/business-profile/callback`;

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_BUSINESS_CLIENT_ID!,
      process.env.GOOGLE_BUSINESS_CLIENT_SECRET!,
      redirectUri,
    );

    let accessToken = ext.access_token ?? null;

    const nowSec = Math.floor(Date.now() / 1000);
    const isExpired =
      typeof ext.expires_at === "number" && ext.expires_at < nowSec - 60;

    if ((!accessToken || isExpired) && ext.refresh_token) {
      try {
        client.setCredentials({ refresh_token: ext.refresh_token });
        const newTokenResp = await client.getAccessToken();
        const newAccessToken = newTokenResp?.token ?? null;

        if (!newAccessToken) {
          throw new Error("empty_access_token_after_refresh");
        }

        accessToken = newAccessToken;

        const expiryMs = client.credentials.expiry_date;
        const newExpiresAtSec =
          typeof expiryMs === "number"
            ? Math.floor(expiryMs / 1000)
            : null;

        await prisma.externalConnection.update({
          where: { id: ext.id },
          data: {
            access_token: newAccessToken,
            expires_at: newExpiresAtSec ?? undefined,
          },
        });
      } catch (err) {
        console.error("[GBP][locations/sync] error refreshing token:", err);
        return NextResponse.json(
          { ok: false, error: "token_refresh_failed" },
          { status: 401 },
        );
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        { ok: false, error: "no_valid_access_token" },
        { status: 401 },
      );
    }

    // 4) Llamada REAL al endpoint de locations (Business Information v1)
    const readMask =
      "name,title,storeCode,metadata,regularHours,serviceArea,websiteUri,phoneNumbers,languageCode";

    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${googleAccountName}/locations?readMask=${encodeURIComponent(
      readMask,
    )}`;

    const resp = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("[GBP][locations/sync] Google API error", resp.status, text);
      return NextResponse.json(
        {
          ok: false,
          error: "google_api_error",
          status: resp.status,
          message: text || undefined,
        },
        { status: 502 },
      );
    }

    const json = (await resp.json()) as any;
    const rawLocations = Array.isArray(json.locations) ? json.locations : [];

    // 5) UPSERT COMPLETO en google_gbp_location
    const upserted = await prisma.$transaction(async (tx) => {
      const results: {
        id: string;
        google_location_id: string;
        google_location_name: string;
        google_location_title: string | null;
        address: string | null;
        status: string;
        raw_json: any;
      }[] = [];

      for (const loc of rawLocations) {
        const name: string = String(loc.name ?? "").trim();
        if (!name) {
          continue;
        }

        // name: "accounts/.../locations/2386..."
        const googleLocationName = name;
        const googleLocationId = name.split("/").pop() ?? "";
        if (!googleLocationId) {
          continue;
        }

        const title: string | null = loc.title ?? loc.locationName ?? "Sin nombre";

        // Dirección legible
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

        // Phone (si viene en phoneNumbers)
        let primaryPhone: string | null = null;
        if (loc.phoneNumbers) {
          if (typeof loc.phoneNumbers.primaryPhone === "string") {
            primaryPhone = loc.phoneNumbers.primaryPhone;
          } else if (
            loc.phoneNumbers.primaryPhone &&
            typeof loc.phoneNumbers.primaryPhone.number === "string"
          ) {
            primaryPhone = loc.phoneNumbers.primaryPhone.number;
          }
        }

        const placeId: string | null =
          (loc.metadata && loc.metadata.placeId) || null;

        const businessType: string | null =
          (loc.metadata && loc.metadata.primaryCategoryName) || null;

        const storeCode: string | null = loc.storeCode ?? null;
        const serviceArea: any = loc.serviceArea ?? null;
        const regularHours: any = loc.regularHours ?? null;
        const websiteUri: string | null = loc.websiteUri ?? null;
        const regionCode: string | null = serviceArea?.regionCode ?? null;
        const languageCode: string | null = loc.languageCode ?? null;
        const mapsUri: string | null = loc.metadata?.mapsUri ?? null;
        const newReviewUri: string | null = loc.metadata?.newReviewUri ?? null;

        const record = await tx.google_gbp_location.upsert({
          where: {
            company_id_google_location_id: {
              company_id: companyId,
              google_location_id: googleLocationId,
            },
          },
          create: {
            company_id: companyId,
            account_id: gbpAccount.id,
            external_connection_id: ext.id,
            google_location_id: googleLocationId,
            google_location_title: title,
            google_location_name: googleLocationName,
            address,
            status: "available", // 🔹 nuevas: por defecto disponibles
            title,
            primary_phone: primaryPhone,
            google_place_id: placeId,
            place_id: placeId,
            business_type: businessType,
            store_code: storeCode,
            website_uri: websiteUri,
            region_code: regionCode,
            language_code: languageCode,
            maps_uri: mapsUri,
            new_review_uri: newReviewUri,
            service_area: serviceArea ?? undefined,
            regular_hours: regularHours ?? undefined,
            metadata: loc.metadata ?? undefined,
            raw_json: loc,
          },
          update: {
            // NO tocamos status aquí para no machacar "active"/"blocked" etc.
            google_location_title: title,
            google_location_name: googleLocationName,
            address,
            title,
            primary_phone: primaryPhone,
            google_place_id: placeId,
            place_id: placeId,
            business_type: businessType,
            store_code: storeCode,
            website_uri: websiteUri,
            region_code: regionCode,
            language_code: languageCode,
            maps_uri: mapsUri,
            new_review_uri: newReviewUri,
            service_area: serviceArea ?? undefined,
            regular_hours: regularHours ?? undefined,
            metadata: loc.metadata ?? undefined,
            raw_json: loc,
          },
        });

        results.push({
          id: record.id,
          google_location_id: record.google_location_id,
          google_location_name: record.google_location_name ?? "",
          google_location_title: record.google_location_title,
          address: record.address,
          status: record.status,
          raw_json: loc,
        });
      }

      return results;
    });

    const upsertedCount = upserted.length;

    // 6) Mapear al formato del modal
    const locations: GbpLocationWire[] = upserted.map((rec) => {
      const loc = rec.raw_json as any;
      let addr = rec.address ?? "";

      if (!addr) {
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

          addr = parts.filter(Boolean).join(", ");
        }

        if (!addr) {
          const placeName =
            loc?.serviceArea?.places?.placeInfos?.[0]?.placeName ?? null;
          if (placeName) addr = placeName;
        }
      }

      return {
        id: rec.id, // 🔑 usamos el UUID de google_gbp_location
        externalLocationName: rec.google_location_name,
        title: rec.google_location_title ?? "Sin nombre",
        address: addr,
        rating: undefined,
        totalReviewCount: undefined,
        status: (rec.status as GbpLocationWire["status"]) ?? "available",
      };
    });

    // 7) Disparar sincronización de reviews (todas las ubicaciones de esta company)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (!baseUrl) {
        console.error(
          "[GBP][locations/sync] NEXT_PUBLIC_APP_URL no definido, no se lanza sync de reviews",
        );
      } else {
        const resp = await fetch(
          `${baseUrl}/api/integrations/google/business-profile/reviews`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ companyId }),
          },
        );

        if (!resp.ok) {
          const text = await resp.text().catch(() => "");
          console.error(
            "[GBP][locations/sync] reviews sync failed",
            resp.status,
            text.slice(0, 300),
          );
        }
      }
    } catch (err) {
      console.error(
        "[GBP][locations/sync] Error lanzando sync de reviews:",
        err,
      );
    }

    const maxConnectable = 1; // lo dejamos igual de momento

    return NextResponse.json({
      ok: true,
      locations,
      maxConnectable,
      synced: {
        totalFromGoogle: rawLocations.length,
        upserted: upsertedCount,
      },
    });
  } catch (err) {
    console.error("[GBP][locations/sync] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "unexpected_error" },
      { status: 500 },
    );
  }
}
