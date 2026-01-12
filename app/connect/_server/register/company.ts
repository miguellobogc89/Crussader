// app/connect/_server/register/company.ts
import { prisma } from "@/app/server/db";

export type EnsureCompanyResult =
  | {
      ok: true;
      companyCase: "CREATED" | "EXISTING";
      companyId: string;
      gbpAccountId: string; // google_gbp_account.id (uuid)
      debug: {
        google_account_id: string;
        google_account_name: string | null;
        updatedGbp: boolean;
      };
    }
  | {
      ok: false;
      error: "missing_user_account_id" | "missing_google_account_id";
    };

function normStr(v: unknown) {
  if (typeof v !== "string") return "";
  return v.trim();
}

export async function ensureCompanyAndGbpAccount(params: {
  userId: string;
  userAccountId: string | null; // User.account_id (uuid) REQUIRED para Company
  googleAccountId: string; // gbAccountName, ej: "accounts/1181414..."
  googleAccountName: string | null; // displayName
  pickedAccountRaw?: any; // json raw de Google accounts[0]
}): Promise<EnsureCompanyResult> {
  const google_account_id = normStr(params.googleAccountId);
  if (!google_account_id) return { ok: false, error: "missing_google_account_id" };

  if (!params.userAccountId) {
    // No inventamos la tabla `account` ni creamos cosas sin schema.
    return { ok: false, error: "missing_user_account_id" };
  }

  const google_account_name = params.googleAccountName ? normStr(params.googleAccountName) : null;

  // 1) ¿Existe ya este google_account_id?
  // Si tú ya metiste unique a google_account_id, esto debería ser único.
  // Si no lo es, findFirst igual funcionará pero tomaría el primero.
  const existingGbp = await prisma.google_gbp_account.findFirst({
    where: { google_account_id },
    select: { id: true, company_id: true, google_account_name: true },
  });

  if (existingGbp?.id) {
    // Actualizamos SOLO el raw GBP (seguro) y meta; no tocamos Company aquí.
    let updatedGbp = false;

    const updates: Record<string, any> = {};
    if (google_account_name && existingGbp.google_account_name !== google_account_name) {
      updates.google_account_name = google_account_name;
    }
    if (params.pickedAccountRaw) {
      updates.meta = params.pickedAccountRaw;
    }
    // update timestamp (tu schema no usa @updatedAt, así que lo hacemos explícito)
    updates.updated_at = new Date();

    if (Object.keys(updates).length > 1 || (Object.keys(updates).length === 1 && updates.updated_at)) {
      await prisma.google_gbp_account.update({
        where: { id: existingGbp.id },
        data: updates,
        select: { id: true },
      });
      updatedGbp = true;
    }

    return {
      ok: true,
      companyCase: "EXISTING",
      companyId: existingGbp.company_id,
      gbpAccountId: existingGbp.id,
      debug: {
        google_account_id,
        google_account_name,
        updatedGbp,
      },
    };
  }

  // 2) No existe: creamos Company + google_gbp_account
  // Company mínima viable. NO pisamos cosas “curadas” (aún no existen).
  const company = await prisma.company.create({
    data: {
      name: google_account_name || "Empresa",
      createdById: params.userId,
      account_id: params.userAccountId,
      // opcional: email de contacto si luego quieres, pero aquí no lo tenemos
    },
    select: { id: true },
  });

  const gbp = await prisma.google_gbp_account.create({
    data: {
      company_id: company.id,
      google_account_id,
      google_account_name,
      status: "active",
      meta: params.pickedAccountRaw ?? undefined,
      updated_at: new Date(),
    },
    select: { id: true },
  });

  return {
    ok: true,
    companyCase: "CREATED",
    companyId: company.id,
    gbpAccountId: gbp.id,
    debug: {
      google_account_id,
      google_account_name,
      updatedGbp: false,
    },
  };
}
