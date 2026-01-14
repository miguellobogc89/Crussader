// app/connect/_server/newLocation.ts
import { prisma } from "@/app/server/db";

const PROVIDER = "google-business";

function normStr(v: unknown) {
  if (typeof v !== "string") return "";
  return v.trim();
}

// "accounts/118141498427943054563" -> "118141498427943054563"
function extractGoogleAccountId(gbAccountName: string): string {
  const s = normStr(gbAccountName);
  if (!s) return "";
  const parts = s.split("/");
  const last = parts[parts.length - 1] || "";
  return last.trim();
}

// "accounts/.../locations/123" -> "123"
function extractGoogleLocationId(locationName: string): string {
  const s = normStr(locationName);
  if (!s) return "";
  const parts = s.split("/");
  const last = parts[parts.length - 1] || "";
  return last.trim();
}

function canonicalGoogleAccountId(v: string) {
  const s = normStr(v);
  if (!s) return "";
  if (s.includes("/")) return extractGoogleAccountId(s);
  return s;
}

export type GoogleLocationLite = {
  name: string; // "accounts/.../locations/..."
  title?: string | null;
  raw?: any;
};

export type NewLocationResult =
  | {
      ok: true;
      case: "NEW_LOCATION_CREATED_OR_REUSED";
      companyId: string;
      externalConnectionId: string;
      gbpAccountId: string;
      matchedLocationId: string;
      matchedGoogleLocationId: string;
      processed: Array<{
        googleLocationId: string;
        locationId: string;
        googleGbpLocationId: string;
        action: "CREATED" | "REUSED";
      }>;
    }
  | {
      ok: false;
      error:
        | "missing_inputs"
        | "cannot_adopt_company"
        | "external_connection_missing_token"
        | "failed";
      detail?: any;
    };

export async function newLocation(params: {
  userId: string;
  accountEmail: string;

  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null;
  scope: string | null;

  googleAccountId: string; // "accounts/..." o "118..."
  googleAccountName: string | null;
  pickedAccountRaw?: any;

  // el match detectado por el orquestador
  matchedLocationId: string;
  matchedGoogleLocationId: string;

  // locations entrantes (del API)
  locations: GoogleLocationLite[];
}): Promise<NewLocationResult> {
  const userId = normStr(params.userId);
  const accountEmail = normStr(params.accountEmail);

  const googleAccountIdCanonical = canonicalGoogleAccountId(params.googleAccountId);
  const googleAccountName = params.googleAccountName ? normStr(params.googleAccountName) : null;

  const matchedLocationId = normStr(params.matchedLocationId);
  const matchedGoogleLocationId = normStr(params.matchedGoogleLocationId);

  if (!userId || !accountEmail || !googleAccountIdCanonical || !matchedLocationId || !matchedGoogleLocationId) {
    return {
      ok: false,
      error: "missing_inputs",
      detail: {
        userId: Boolean(userId),
        accountEmail: Boolean(accountEmail),
        googleAccountIdCanonical: Boolean(googleAccountIdCanonical),
        matchedLocationId: Boolean(matchedLocationId),
        matchedGoogleLocationId: Boolean(matchedGoogleLocationId),
      },
    };
  }

  if (!params.accessToken) {
    return { ok: false, error: "external_connection_missing_token" };
  }

  const incomingLocations = (params.locations || [])
    .map((l) => {
      const fullName = normStr(l?.name);
      const id = extractGoogleLocationId(fullName);
      const title = l?.title ? normStr(l.title) : null;
      return { fullName, id, title, raw: l?.raw };
    })
    .filter((x) => x.id.length > 0);

  const incomingGoogleLocationIds = incomingLocations.map((x) => x.id);

  console.log("[newLocation] ENTER", {
    matchedLocationId,
    matchedGoogleLocationId,
    incomingGoogleLocationIds,
  });
  console.log(
    `[newLocation] Coincide esta location (${matchedGoogleLocationId}) con location_id=${matchedLocationId}. Ha entrado aqui.`
  );

  // 1) Adoptamos company desde la location existente (regla que acabas de confirmar)
  const matchedLoc = await prisma.location.findUnique({
    where: { id: matchedLocationId },
    select: { id: true, companyId: true, googleLocationId: true },
  });

  if (!matchedLoc?.companyId) {
    return {
      ok: false,
      error: "cannot_adopt_company",
      detail: { matchedLocationId, matchedLoc },
    };
  }

  const companyId = matchedLoc.companyId;

  // expires_at (unix seconds)
  let expires_at: number | null = null;
  if (typeof params.expiresIn === "number" && params.expiresIn > 0) {
    expires_at = Math.floor(Date.now() / 1000) + params.expiresIn;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // 2) ExternalConnection del user (upsert manual: si existe la reutilizamos y refrescamos tokens)
      const existingExt = await tx.externalConnection.findUnique({
        where: { userId_provider: { userId, provider: PROVIDER } },
        select: { id: true },
      });

      let externalConnectionId: string;

      if (existingExt?.id) {
        const updatedExt = await tx.externalConnection.update({
          where: { id: existingExt.id },
          data: {
            accountEmail,
            access_token: params.accessToken,
            refresh_token: params.refreshToken ?? null,
            expires_at,
            scope: params.scope ?? null,
            status: "active",
            companyId, // 🔥 ahora apunta a la company adoptada
            accountName: googleAccountName ?? null,
          },
          select: { id: true },
        });
        externalConnectionId = updatedExt.id;
      } else {
        const createdExt = await tx.externalConnection.create({
          data: {
            userId,
            provider: PROVIDER,
            accountEmail,
            access_token: params.accessToken,
            refresh_token: params.refreshToken ?? null,
            expires_at,
            scope: params.scope ?? null,
            status: "active",
            companyId, // 🔥 company adoptada
            accountName: googleAccountName ?? null,
          },
          select: { id: true },
        });
        externalConnectionId = createdExt.id;
      }

// 3) Asegurar userCompany (idempotente, sin abortar la tx)
await tx.userCompany.upsert({
  where: {
    userId_companyId: {
      userId,
      companyId,
    },
  },
  create: {
    userId,
    companyId,
    role: "MEMBER" as any,
  },
  update: {
    // opcional: si quieres mantener role
    role: "MEMBER" as any,
  },
  select: { id: true },
});


      // 4) Crear o reutilizar google_gbp_account para este GBP account (evita choque de UNIQUE)
      const existingGbp = await tx.google_gbp_account.findFirst({
        where: {
          OR: [
            { google_account_id: googleAccountIdCanonical },
            { google_account_id: `accounts/${googleAccountIdCanonical}` },
          ],
        },
        select: { id: true, company_id: true, google_account_id: true },
      });

      const gbp = existingGbp?.id
        ? await tx.google_gbp_account.update({
            where: { id: existingGbp.id },
            data: {
              company_id: companyId,
              external_connection_id: externalConnectionId,
              google_account_id: googleAccountIdCanonical, // normalizamos
              google_account_name: googleAccountName,
              status: "active",
              meta: params.pickedAccountRaw ?? undefined,
              updated_at: new Date(),
            },
            select: { id: true },
          })
        : await tx.google_gbp_account.create({
            data: {
              company_id: companyId,
              external_connection_id: externalConnectionId,
              google_account_id: googleAccountIdCanonical,
              google_account_name: googleAccountName,
              status: "active",
              meta: params.pickedAccountRaw ?? undefined,
              updated_at: new Date(),
            },
            select: { id: true },
          });

      console.log("[newLocation] GBP ACCOUNT", {
        action: existingGbp?.id ? "REUSED" : "CREATED",
        gbpAccountId: gbp.id,
        storedGoogleAccountId: existingGbp?.google_account_id ?? googleAccountIdCanonical,
        companyId,
        externalConnectionId,
      });


      // 5) Procesar locations
      const processed: Array<{
        googleLocationId: string;
        locationId: string;
        googleGbpLocationId: string;
        action: "CREATED" | "REUSED";
      }> = [];

      for (const l of incomingLocations) {
        const google_location_id = l.id; // canonical
        const google_location_name = l.fullName; // resourceName completo
        const titleRaw = l.title ? normStr(l.title) : "";
        const finalTitle = titleRaw || "Ubicación";

        const existingLoc = await tx.location.findFirst({
          where: { googleLocationId: google_location_id },
          select: { id: true },
        });

        let locationId: string;
        let action: "CREATED" | "REUSED";

        if (existingLoc?.id) {
          locationId = existingLoc.id;
          action = "REUSED";
        } else {
          const createdLoc = await tx.location.create({
            data: {
              companyId,
              title: finalTitle,
              googleLocationId: google_location_id,
              googleName: google_location_name || google_location_id,
              status: "DRAFT",
            },
            select: { id: true },
          });

          locationId = createdLoc.id;
          action = "CREATED";
        }

        // google_gbp_location: UNIQUE(company_id, google_location_id)
        // => si ya existía por otra conexión/otra cuenta, lo vamos a "reapuntar" a esta external/account
        const gbpLoc = await tx.google_gbp_location.upsert({
          where: {
            company_id_google_location_id: {
              company_id: companyId,
              google_location_id: google_location_id,
            },
          },
          create: {
            company_id: companyId,
            account_id: gbp.id,
            external_connection_id: externalConnectionId,
            google_location_id: google_location_id,
            google_location_title: finalTitle,
            raw_json: l.raw ?? { name: google_location_name, title: finalTitle },
            status: "active",
            updated_at: new Date(),
            google_location_name: google_location_name || google_location_id,
            title: finalTitle,
            location_id: locationId,
            is_active: false,
          },
          update: {
            account_id: gbp.id,
            external_connection_id: externalConnectionId,
            google_location_title: finalTitle,
            raw_json: l.raw ?? undefined,
            updated_at: new Date(),
            google_location_name: google_location_name || google_location_id,
            title: finalTitle,
            location_id: locationId,
          },
          select: { id: true },
        });

        processed.push({
          googleLocationId: google_location_id,
          locationId,
          googleGbpLocationId: gbpLoc.id,
          action,
        });
      }

      console.log("[newLocation] DONE", {
        companyId,
        externalConnectionId,
        gbpAccountId: gbp.id,
        processedCount: processed.length,
      });

      return {
        ok: true,
        case: "NEW_LOCATION_CREATED_OR_REUSED",
        companyId,
        externalConnectionId,
        gbpAccountId: gbp.id,
        matchedLocationId,
        matchedGoogleLocationId,
        processed,
      };
    });
  } catch (e) {
    console.error("[newLocation] FAILED", e);
    return { ok: false, error: "failed" };
  }
}
