// app/api/account/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
declare global { var _prisma: PrismaClient | undefined }
if (!global._prisma) global._prisma = new PrismaClient();
prisma = global._prisma;

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
      select: { id: true, account_id: true },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 404 });
    }

    // Busca la cuenta asociada al usuario (directa o por ownership)
    let acct = user.account_id
      ? await prisma.account.findUnique({ where: { id: user.account_id } })
      : await prisma.account.findFirst({ where: { owner_user_id: user.id } });

    if (!acct) {
      return NextResponse.json({
        ok: true,
        status: "none",
        nowIso: new Date().toISOString(),
        accountId: null,
      });
    }

    const now = new Date();
    const statusField = acct.subscription_status || "NONE";

    let status = statusField;
    let trialInfo = null;
    let subscriptionInfo = null;

    // === FALLBACK automático si no hay subscription_status asignado ===
    if (status === "NONE" || status === null) {
      const trialStart = acct.trial_start_at ? new Date(acct.trial_start_at) : null;
      const trialEnd = acct.trial_end_at ? new Date(acct.trial_end_at) : null;
      const planRenews = acct.plan_renews_at ? new Date(acct.plan_renews_at) : null;

      if (trialStart && trialEnd && now >= trialStart && now <= trialEnd) {
        status = "TRIAL";
      } else if (planRenews && planRenews > now) {
        status = "ACTIVE";
      } else if (acct.trial_used) {
        status = "TRIAL_ENDED";
      } else {
        status = "NONE";
      }
    }

    // === Información adicional por estado ===
    if (status === "TRIAL") {
      const daysLeft = Math.max(
        0,
        Math.ceil(
          (new Date(acct.trial_end_at!).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      trialInfo = {
        startAt: acct.trial_start_at,
        endAt: acct.trial_end_at,
        daysLeft,
        usedBefore: acct.trial_used,
      };
    }

    if (status === "ACTIVE") {
      subscriptionInfo = {
        planSlug: acct.plan_slug,
        renewsAt: acct.plan_renews_at,
      };
    }

    // === Respuesta final unificada ===
    return NextResponse.json({
      ok: true,
      status: status.toLowerCase(), // ej. "trial", "active", "none"
      nowIso: now.toISOString(),
      accountId: acct.id,
      trial: trialInfo,
      subscription: subscriptionInfo,
    });
  } catch (err) {
    console.error("[GET /api/account/status] error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
