// app/connect/_server/register/accounts.ts
import { prisma } from "@/app/server/db";

type RegisterAccountInput = {
  userId: string;

  // Google
  accountEmail: string;
  gbAccountName: string; // "accounts/118..."
  gbAccountDisplayName: string | null;

  // Tokens (para ExternalConnection)
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number | null;

  // Raw/meta opcional
  pickedAccountRaw: any;
};

function extractGoogleAccountId(gbAccountName: string): string {
  const parts = gbAccountName.split("/");
  const last = parts[parts.length - 1] || "";
  return last.trim();
}

export async function registerCompanyAndConnectionIfNeeded(input: RegisterAccountInput) {
  const google_account_id = extractGoogleAccountId(input.gbAccountName);

  if (!google_account_id) {
    return {
      ok: false,
      error: "missing_google_account_id",
      created: {
        account: false,
        company: false,
        google_gbp_account: false,
        externalConnection: false,
      },
      ids: {
        account_id: null as string | null,
        company_id: null as string | null,
        google_gbp_account_id: null as string | null,
        external_connection_id: null as string | null,
      },
      google_account_id: null as string | null,
    };
  }

  // 1) google_gbp_account por google_account_id (ojo: en Prisma NO es unique en schema, así que usamos findFirst)
  const existingGbpAccount = await prisma.google_gbp_account.findFirst({
    where: { google_account_id },
    select: { id: true, company_id: true, google_account_id: true },
  });

  let createdAccount = false;
  let createdCompany = false;
  let createdGbpAccount = false;

  let account_id: string | null = null;
  let company_id: string | null = null;
  let google_gbp_account_id: string | null = null;

  if (existingGbpAccount?.id) {
    google_gbp_account_id = existingGbpAccount.id;
    company_id = existingGbpAccount.company_id;

    const existingCompany = await prisma.company.findUnique({
      where: { id: company_id },
      select: { id: true, account_id: true },
    });

    if (existingCompany?.id) {
      account_id = existingCompany.account_id;
    } else {
      // Caso raro: existe google_gbp_account pero no Company -> creamos lo mínimo
      // Creamos account interno
      let createdAccountRow: any = null;

      try {
        createdAccountRow = await (prisma as any).account.create({
          data: { owner_user_id: input.userId },
          select: { id: true },
        });
      } catch {
        createdAccountRow = await (prisma as any).account.create({
          data: {},
          select: { id: true },
        });
      }

      createdAccount = true;
      account_id = createdAccountRow?.id ?? null;

      const newCompany = await prisma.company.create({
        data: {
          name: input.gbAccountDisplayName || "Google Business",
          createdById: input.userId,
          account_id: account_id as string,
        },
        select: { id: true },
      });

      createdCompany = true;
      company_id = newCompany.id;

      // NO actualizamos google_gbp_account existente para no tocar nada (tal y como pediste).
      // OJO: esto deja google_gbp_account.company_id apuntando a un company que no existe si venía roto,
      // pero ese caso ya es un estado inconsistente previo.
    }
  } else {
    // 2) No existe google_gbp_account -> crear account interno + company + google_gbp_account
    let createdAccountRow: any = null;

    try {
      createdAccountRow = await (prisma as any).account.create({
        data: { owner_user_id: input.userId },
        select: { id: true },
      });
    } catch {
      createdAccountRow = await (prisma as any).account.create({
        data: {},
        select: { id: true },
      });
    }

    createdAccount = true;
    account_id = createdAccountRow?.id ?? null;

    const newCompany = await prisma.company.create({
      data: {
        name: input.gbAccountDisplayName || "Google Business",
        createdById: input.userId,
        account_id: account_id as string,
      },
      select: { id: true },
    });

    createdCompany = true;
    company_id = newCompany.id;

    const newGbpAccount = await prisma.google_gbp_account.create({
      data: {
        company_id: company_id,
        google_account_id,
        google_account_name: input.gbAccountDisplayName,
        status: "active",
        meta: input.pickedAccountRaw ?? undefined,
      },
      select: { id: true },
    });

    createdGbpAccount = true;
    google_gbp_account_id = newGbpAccount.id;

    // Dar acceso al user a esa company (si no existía)
    await prisma.userCompany.create({
      data: {
        userId: input.userId,
        companyId: company_id,
        role: "MEMBER",
      },
    }).catch(() => {
      // si ya existe por @@unique([userId, companyId]) -> ignoramos
    });
  }

  // 3) ExternalConnection: insertar si no existe (NO UPDATE)
  const provider = "google_gbp";

  const existingConn = await prisma.externalConnection.findFirst({
    where: { userId: input.userId, provider },
    select: { id: true, companyId: true },
  });

  let createdExternalConnection = false;
  let external_connection_id: string | null = null;

  if (existingConn?.id) {
    external_connection_id = existingConn.id;
  } else {
    const createdConn = await prisma.externalConnection.create({
      data: {
        userId: input.userId,
        provider,
        accountEmail: input.accountEmail,
        access_token: input.accessToken,
        refresh_token: input.refreshToken,
        expires_at: input.expiresAt,
        companyId: company_id,
        accountName: input.gbAccountDisplayName || undefined,
        status: "active",
      },
      select: { id: true },
    });

    createdExternalConnection = true;
    external_connection_id = createdConn.id;
  }

  return {
    ok: true,
    created: {
      account: createdAccount,
      company: createdCompany,
      google_gbp_account: createdGbpAccount,
      externalConnection: createdExternalConnection,
    },
    ids: {
      account_id,
      company_id,
      google_gbp_account_id,
      external_connection_id,
    },
    google_account_id,
  };
}
