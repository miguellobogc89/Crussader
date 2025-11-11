// app/api/billing/account/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getBootstrapData } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, account_id: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // 1) Bootstrap para detectar company activa
    let bootstrap = null;
    try {
      bootstrap = await getBootstrapData();
    } catch {
      // si falla bootstrap seguimos
    }

    const activeCompanyId = bootstrap?.activeCompany?.id ?? null;
    const firstCompanyId =
      bootstrap?.companiesResolved?.[0]?.id ??
      bootstrap?.companies?.[0]?.companyId ??
      null;
    const targetCompanyId = activeCompanyId ?? firstCompanyId ?? null;

    // 2) Si el usuario ya tiene account_id y existe, reutilizar
    if (user.account_id) {
      const existing = await prisma.account.findUnique({
        where: { id: user.account_id },
      });

      if (existing) {
        if (targetCompanyId) {
          // Forzamos que esa company apunte a esta account
          await prisma.company.updateMany({
            where: { id: targetCompanyId },
            data: { account_id: existing.id },
          });
        }

        return NextResponse.json({
          ok: true,
          account: {
            id: existing.id,
            subscriptionStatus: existing.subscription_status,
          },
        });
      }
    }

    // 3) Si hay account con owner_user_id = user.id, reutilizar
    const owned = await prisma.account.findFirst({
      where: { owner_user_id: user.id },
    });

    if (owned) {
      if (!user.account_id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { account_id: owned.id },
        });
      }

      if (targetCompanyId) {
        await prisma.company.updateMany({
          where: { id: targetCompanyId },
          data: { account_id: owned.id },
        });
      }

      return NextResponse.json({
        ok: true,
        account: {
          id: owned.id,
          subscriptionStatus: owned.subscription_status,
        },
      });
    }

    // 4) No existe account -> crear en TRIAL
    const now = new Date();
    const trialDays = 7;
    const trialEnd = new Date(
      now.getTime() + trialDays * 24 * 60 * 60 * 1000
    );

    const created = await prisma.account.create({
      data: {
        name: `Cuenta ${user.id.slice(0, 6)}`,
        slug: `acct-${user.id.slice(0, 6)}-${now.getTime().toString(36)}`,
        owner_user_id: user.id,
        status: "active",
        subscription_status: "TRIAL",
        trial_start_at: now,
        trial_end_at: trialEnd,
        trial_used: false,
      },
    });

    // 5) Linkear company si hay target
    if (targetCompanyId) {
      await prisma.company.updateMany({
        where: { id: targetCompanyId },
        data: { account_id: created.id },
      });
    }

    // 6) Linkear user.account_id
    await prisma.user.update({
      where: { id: user.id },
      data: { account_id: created.id },
    });

    return NextResponse.json({
      ok: true,
      account: {
        id: created.id,
        subscriptionStatus: created.subscription_status,
      },
    });
  } catch (err) {
    console.error("[POST /api/billing/account] error:", err);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
