// app/connect/_server/newAccount.ts
import { prisma } from "@/app/server/db";

const PROVIDER = "google-business";

function normStr(v: unknown) {
  if (typeof v !== "string") return "";
  return v.trim();
}

function slugify(input: string) {
  const s = (input || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (s.length > 0) return s;
  return "account";
}

function uniqSuffix() {
  return Math.random().toString(36).slice(2, 8);
}

export type GoogleLocationLite = {
  name: string; // "accounts/.../locations/..."
  title?: string | null;
  raw?: any;
};

export type CreateNewAccountResult =
  | {
      ok: true;
      accountId: string;
      companyId: string;
      externalConnectionId: string;
      gbpAccountId: string;
      createdLocations: Array<{ locationId: string; googleGbpLocationId: string }>;
    }
  | {
      ok: false;
      error:
        | "external_connection_exists"
        | "google_account_already_registered"
        | "location_already_exists"
        | "location_conflict"
        | "invalid_locations_payload";
      detail?: any;
    };

export async function createNewAccount(params: {
  userId: string;
  email: string;
  googleAccountId: string; // "accounts/..."
  googleAccountName: string | null;
  pickedAccountRaw?: any;

  accessToken: string;
  refreshToken: string | null;
  expiresIn: number | null; // seconds
  scope: string | null;

  locations: GoogleLocationLite[];
}): Promise<CreateNewAccountResult> {
  const userId = normStr(params.userId);
  const email = normStr(params.email);
  const googleAccountId = normStr(params.googleAccountId);
  const googleAccountName = params.googleAccountName ? normStr(params.googleAccountName) : null;

  if (!userId) throw new Error("createNewAccount: missing userId");
  if (!email) throw new Error("createNewAccount: missing email");
  if (!googleAccountId) throw new Error("createNewAccount: missing googleAccountId");
  if (!params.accessToken) throw new Error("createNewAccount: missing accessToken");

  const googleLocationIds = (params.locations || [])
    .map((l) => normStr(l?.name))
    .filter((x) => x.length > 0);

  if (googleLocationIds.length === 0) {
    return { ok: false, error: "invalid_locations_payload" };
  }

  // ✅ GUARDIA 1: si ya existe google_gbp_account para ese google_account_id, no es "new"
  // (Ojo: tu unique real es (company_id, google_account_id), así que esto es una guardia lógica)
  const existingGbp = await prisma.google_gbp_account.findFirst({
    where: { google_account_id: googleAccountId },
    select: { id: true, company_id: true },
  });

  if (existingGbp?.id) {
    return {
      ok: false,
      error: "google_account_already_registered",
      detail: { gbpAccountId: existingGbp.id, companyId: existingGbp.company_id },
    };
  }

  // ✅ GUARDIA 2: si existe Location por googleLocationId, NO petamos: la adoptamos si es del mismo googleAccountId
  // Pero si pertenece a otro googleAccountId -> conflicto (no tocamos)
  const existingLocations = await prisma.location.findMany({
    where: { googleLocationId: { in: googleLocationIds } },
    select: { id: true, googleLocationId: true, companyId: true, googleAccountId: true },
    take: 50,
  });

  if (existingLocations.length > 0) {
    for (const ex of existingLocations) {
      if (ex.googleAccountId && ex.googleAccountId !== googleAccountId) {
        return {
          ok: false,
          error: "location_conflict",
          detail: {
            googleLocationId: ex.googleLocationId,
            existingCompanyId: ex.companyId,
            existingGoogleAccountId: ex.googleAccountId,
            incomingGoogleAccountId: googleAccountId,
          },
        };
      }
    }
    // Si estamos aquí: existen, pero no contradicen googleAccountId -> luego las adoptamos dentro de la tx.
  }

  let expires_at: number | null = null;
  if (typeof params.expiresIn === "number" && params.expiresIn > 0) {
    expires_at = Math.floor(Date.now() / 1000) + params.expiresIn;
  }

  const accountNameBase = googleAccountName || "Cuenta";
  const accountSlugBase = slugify(accountNameBase);

  return await prisma.$transaction(async (tx) => {
    // ✅ GUARDIA 3: si ya hay ExternalConnection para user+provider, no es new
    const alreadyExt = await tx.externalConnection.findUnique({
      where: { userId_provider: { userId, provider: PROVIDER } },
      select: { id: true },
    });
    if (alreadyExt?.id) {
      return { ok: false, error: "external_connection_exists" };
    }

    // 1) account
    const account = await tx.account.create({
      data: {
        name: accountNameBase,
        slug: `${accountSlugBase}-${uniqSuffix()}`,
        owner_user_id: userId,
        status: "active",
      },
      select: { id: true },
    });

    // 2) user.account_id
    await tx.user.update({
      where: { id: userId },
      data: { account_id: account.id },
      select: { id: true },
    });

    // 3) company
    const company = await tx.company.create({
      data: {
        name: googleAccountName || "Empresa",
        createdById: userId,
        account_id: account.id,
        email: email || null,
        plan: "free",
      },
      select: { id: true },
    });

    // 4) userCompany
    await tx.userCompany.create({
      data: { userId, companyId: company.id },
      select: { id: true },
    });

    // 5) external connection
    const ext = await tx.externalConnection.create({
      data: {
        userId,
        provider: PROVIDER,
        accountEmail: email,
        access_token: params.accessToken,
        refresh_token: params.refreshToken ?? null,
        expires_at,
        companyId: company.id,
        accountName: googleAccountName ?? null,
        scope: params.scope ?? null,
        status: "active",
      },
      select: { id: true },
    });

    // 6) google_gbp_account
    const gbp = await tx.google_gbp_account.create({
      data: {
        company_id: company.id,
        external_connection_id: ext.id,
        google_account_id: googleAccountId,
        google_account_name: googleAccountName,
        status: "active",
        meta: params.pickedAccountRaw ?? undefined,
        updated_at: new Date(),
      },
      select: { id: true },
    });

    // 7) locations + google_gbp_location (idempotente y seguro)
    const createdLocations: Array<{ locationId: string; googleGbpLocationId: string }> = [];

    for (const l of params.locations) {
      const google_location_id = normStr(l.name);
      if (!google_location_id) continue;

      const titleRaw = l.title ? normStr(l.title) : "";
      const finalTitle = titleRaw || "Ubicación";

      // A) ¿Existe ya Location por googleLocationId?
const existingLoc = await tx.location.findFirst({
  where: { googleLocationId: google_location_id },
  select: {
    id: true,
    companyId: true,
    googleAccountId: true,
    externalConnectionId: true,
  },
});


      let locId: string;

      if (existingLoc?.id) {
        // ✅ Seguridad: solo adoptamos si coincide el googleAccountId (o está vacío)
        if (existingLoc.googleAccountId && existingLoc.googleAccountId !== googleAccountId) {
          return {
            ok: false,
            error: "location_conflict",
            detail: {
              googleLocationId: google_location_id,
              existingCompanyId: existingLoc.companyId,
              existingGoogleAccountId: existingLoc.googleAccountId,
              incomingGoogleAccountId: googleAccountId,
            },
          };
        }

        const updated = await tx.location.update({
          where: { id: existingLoc.id },
          data: {
            companyId: company.id,
            title: finalTitle,
            externalConnectionId: ext.id,
            googleAccountId: googleAccountId,
            googleLocationId: google_location_id,
            googleName: google_location_id,
          },
          select: { id: true },
        });

        locId = updated.id;
      } else {
        const createdLoc = await tx.location.create({
          data: {
            companyId: company.id,
            title: finalTitle,
            externalConnectionId: ext.id,
            googleAccountId: googleAccountId,
            googleLocationId: google_location_id,
            googleName: google_location_id,
            status: "DRAFT",
          },
          select: { id: true },
        });

        locId = createdLoc.id;
      }

      // B) google_gbp_location: upsert por unique (company_id, google_location_id)
      const gbpLoc = await tx.google_gbp_location.upsert({
where: {
  company_id_google_location_id: {
    company_id: company.id,
    google_location_id: google_location_id,
  },
},

        create: {
          company_id: company.id,
          account_id: gbp.id,
          external_connection_id: ext.id,
          google_location_id: google_location_id,
          google_location_title: finalTitle,
          raw_json: l.raw ?? { name: google_location_id, title: finalTitle },
          status: "active",
          updated_at: new Date(),
          google_location_name: google_location_id,
          title: finalTitle,
          location_id: locId,
          is_active: false,
        },
        update: {
          external_connection_id: ext.id,
          google_location_title: finalTitle,
          raw_json: l.raw ?? undefined,
          updated_at: new Date(),
          google_location_name: google_location_id,
          title: finalTitle,
          location_id: locId,
        },
        select: { id: true },
      });

      createdLocations.push({ locationId: locId, googleGbpLocationId: gbpLoc.id });
    }

    return {
      ok: true,
      accountId: account.id,
      companyId: company.id,
      externalConnectionId: ext.id,
      gbpAccountId: gbp.id,
      createdLocations,
    };
  });
}
