// app/api/billing/current/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserAuth } from "@/lib/authz";

type SubStatus = "TRIALING" | "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELED";

export async function GET() {
  try {
    const { userId } = await getUserAuth();

    // 1) Company del usuario
    const uc = await prisma.userCompany.findFirst({
      where: { userId },
      include: { Company: true },
      orderBy: { createdAt: "asc" },
    });
    if (!uc?.Company) {
      return NextResponse.json({ ok: true, hasPlan: false, source: "account" }, { status: 200 });
    }

    // 2) Account asociada
    const accountId = uc.Company.account_id ?? null;
    if (!accountId) {
      return NextResponse.json({ ok: true, hasPlan: false, source: "account" }, { status: 200 });
    }

    const acc = await prisma.account.findUnique({ where: { id: accountId } });
    if (!acc) {
      return NextResponse.json({ ok: true, hasPlan: false, source: "account" }, { status: 200 });
    }

    // 3) Derivar estado desde account (sin tocar tablas de suscripción)
    const now = new Date();
    const trialActive = acc.trial_end_at && new Date(acc.trial_end_at) > now;
    let status: SubStatus = "CANCELED";
    if (trialActive) status = "TRIALING";
    else if (acc.plan_slug) status = "ACTIVE";

    // 4) Respuesta (solo datos de account)
    return NextResponse.json({
      ok: true,
      hasPlan: Boolean(acc.plan_slug || trialActive),
      source: "account",

      planName: acc.plan_slug ?? null,
      status,

      // Fechas desde account
      trialEndAt: acc.trial_end_at ? new Date(acc.trial_end_at).toISOString() : null,
      currentPeriodEnd: acc.plan_renews_at ? new Date(acc.plan_renews_at).toISOString() : null,

      // Límites y consumo desde account
      maxUsers: acc.max_users ?? 0,
      maxLocations: acc.max_locations ?? 0,
      currentUsers: acc.current_users ?? 0,
      currentLocations: acc.current_locations ?? 0,

      // Campos de precio/moneda/periodo no existen en account → no inventamos
      priceCents: null,
      currency: null,
      billingPeriod: null,
    }, { status: 200 });
  } catch (err: any) {
    const status = err?.status ?? 500;
    return NextResponse.json({ ok: false, error: err?.message ?? "internal_error" }, { status });
  }
}
