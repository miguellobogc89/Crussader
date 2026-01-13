import { prisma } from "@/app/server/db";

type RegisterAccountInput = {
  userId: string;

  // Google
  accountEmail: string;
  gbAccountName: string; // "accounts/118..."
  gbAccountDisplayName: string | null;

  // Tokens
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;

  pickedAccountRaw: any;
};

function extractGoogleAccountId(gbAccountName: string): string {
  return gbAccountName.split("/").pop()?.trim() || "";
}

export async function registerCompanyAndConnectionIfNeeded(input: RegisterAccountInput) {
  const google_account_id = extractGoogleAccountId(input.gbAccountName);
  if (!google_account_id) {
    return { ok: false, error: "missing_google_account_id" };
  }

  // 1️⃣ ¿Existe ya google_gbp_account? (FUENTE DE VERDAD)
  const existingGbp = await prisma.google_gbp_account.findFirst({
    where: { google_account_id },
    select: { id: true, company_id: true },
  });

  let account_id: string;
  let company_id: string;
  let google_gbp_account_id: string;

  let created = {
    account: false,
    company: false,
    google_gbp_account: false,
    externalConnection: false,
  };

  if (existingGbp) {
    // 🔁 Reutilizamos TODO
    google_gbp_account_id = existingGbp.id;
    company_id = existingGbp.company_id;

    const company = await prisma.company.findUnique({
      where: { id: company_id },
      select: { account_id: true },
    });

    if (!company?.account_id) {
      return { ok: false, error: "broken_company_account" };
    }

    account_id = company.account_id;
  } else {
    // 🆕 Crear árbol nuevo (UNA SOLA VEZ)
    const account = await (prisma as any).account.create({
      data: {},
      select: { id: true },
    });
    created.account = true;
    account_id = account.id;

    const company = await prisma.company.create({
      data: {
        name: input.gbAccountDisplayName || "Empresa",
        account_id,
        createdById: input.userId, // informativo, NO estructural
      },
      select: { id: true },
    });
    created.company = true;
    company_id = company.id;

    const gbp = await prisma.google_gbp_account.create({
      data: {
        company_id,
        google_account_id,
        google_account_name: input.gbAccountDisplayName,
        meta: input.pickedAccountRaw ?? undefined,
        status: "active",
      },
      select: { id: true },
    });
    created.google_gbp_account = true;
    google_gbp_account_id = gbp.id;
  }

  // 2️⃣ Asociar usuario a la company (idempotente)
  await prisma.userCompany
    .create({
      data: {
        userId: input.userId,
        companyId: company_id,
        role: "MEMBER",
      },
    })
    .catch(() => {});

  // 3️⃣ ExternalConnection (por usuario)
  const provider = "google_business";

  const existingConn = await prisma.externalConnection.findFirst({
    where: { userId: input.userId, provider },
    select: { id: true },
  });

  let external_connection_id: string | null = null;

  if (existingConn) {
    external_connection_id = existingConn.id;
  } else {
    const conn = await prisma.externalConnection.create({
      data: {
        userId: input.userId,
        provider,
        accountEmail: input.accountEmail,
        access_token: input.accessToken,
        refresh_token: input.refreshToken,
        expires_at: input.expiresAt,
        companyId: company_id,
        accountName: input.gbAccountDisplayName ?? undefined,
        status: "active",
      },
      select: { id: true },
    });
    created.externalConnection = true;
    external_connection_id = conn.id;
  }

  return {
    ok: true,
    created,
    ids: {
      account_id,
      company_id,
      google_gbp_account_id,
      external_connection_id,
    },
    google_account_id,
  };
}
