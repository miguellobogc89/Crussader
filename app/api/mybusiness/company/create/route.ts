// app/api/mybusiness/company/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { CompanyRole } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

/**
 * Obtiene el usuario logueado a partir de la sesión de NextAuth.
 * Si no tiene account_id, se crea uno nuevo al vuelo.
 * Devuelve siempre { id, account_id } o null si no hay sesión.
 */
async function getCurrentUserWithAccount() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  // Cargamos el usuario para ver su account_id
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      account_id: true,
    },
  });

  if (!dbUser) return null;

  // Si ya tenía account_id, listo
  if (dbUser.account_id) {
    return dbUser;
  }

  // No tiene account_id -> creamos una cuenta mínima
  const accountName =
    typeof session.user.name === "string" && session.user.name.trim().length > 0
      ? session.user.name.trim()
      : "Cuenta principal";

  // Slug aleatorio para la cuenta (único)
  const accountSlug = `acc_${Math.random().toString(36).slice(2, 10)}`;

  const account = await prisma.account.create({
    data: {
      name: accountName,
      slug: accountSlug,
    },
  });

  // Asociamos el account_id al usuario
  const updatedUser = await prisma.user.update({
    where: { id: dbUser.id },
    data: { account_id: account.id },
    select: {
      id: true,
      account_id: true,
    },
  });

  return updatedUser;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim() || null : null;
    const phone =
      typeof body.phone === "string" ? body.phone.trim() || null : null;
    const address =
      typeof body.address === "string" ? body.address.trim() || null : null;
    const employeesBand =
      typeof body.employeesBand === "string" && body.employeesBand.trim() !== ""
        ? body.employeesBand.trim()
        : null;

    if (!name) {
      return NextResponse.json(
        { ok: false, error: "NAME_REQUIRED" },
        { status: 400 }
      );
    }

    // Usuario actual (creador) + garantizamos que tenga account_id
    const user = await getCurrentUserWithAccount();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "NO_SESSION" },
        { status: 401 }
      );
    }

    if (!user.account_id) {
      console.warn(
        "[company/create] Usuario sin account_id incluso tras intentar crearlo",
        user.id
      );
      return NextResponse.json(
        { ok: false, error: "NO_ACCOUNT_FOR_USER" },
        { status: 400 }
      );
    }

    // Crear la empresa (solo campos que EXISTEN en el modelo Company)
    const company = await prisma.company.create({
      data: {
        name,
        email,
        phone,
        address,
        employeesBand,
        createdById: user.id,
        account_id: user.account_id,
      },
      select: {
        id: true,
        name: true,
        employeesBand: true,
      },
    });

    // Enlazar al usuario como OWNER de la empresa
    await prisma.userCompany.upsert({
      where: {
        userId_companyId: {
          userId: user.id,
          companyId: company.id,
        },
      },
      create: {
        userId: user.id,
        companyId: company.id,
        role: CompanyRole.OWNER,
      },
      update: {},
    });

    return NextResponse.json({
      ok: true,
      company,
    });
  } catch (err: any) {
    console.error("[company/create] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: err?.message ?? "Unknown error",
        code: err?.code ?? null,
      },
      { status: 500 }
    );
  }
}
