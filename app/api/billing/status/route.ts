// app/api/billing/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "no_auth" }, { status: 401 });
  }

  const userCompany = await prisma.userCompany.findFirst({
    where: { User: { email: session.user.email } },
    include: {
      Company: {
        include: {
          Location: true,
          billing_account: {
            include: {
              subscription: {
                include: {
                  subscription_item: { include: { product: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!userCompany?.Company) {
    return NextResponse.json({ ok: true, active: false });
  }

  const company = userCompany.Company;
  const billingAccount = company.billing_account; // puede ser null
  const subs = (billingAccount?.subscription ?? []) as any[]; // evitar implícitos any

  // buscar la vigente por prioridad simple
  const activeSub =
    subs.find((s: any) => s.status === "ACTIVE") ??
    subs.find((s: any) => s.status === "TRIALING") ??
    null;

  if (!activeSub) {
    return NextResponse.json({
      ok: true,
      active: false,
      plan: company.plan ?? "free",
      locations_allowed: 0,
      locations_in_use: company.Location.length,
    });
  }

  // plan desde meta si viene
  let planName: string | null = null;
  if (
    activeSub.meta &&
    typeof activeSub.meta === "object" &&
    !Array.isArray(activeSub.meta)
  ) {
    const meta = activeSub.meta as Record<string, any>;
    planName = meta.plan_name ?? meta.plan ?? null;
  }

  // cupos de ubicaciones (base 1 + addons LOCATION)
  let allowed = 1;
  for (const item of activeSub.subscription_item as any[]) {
    if (item?.product?.type === "LOCATION") {
      allowed += item?.quantity ?? 0;
    }
  }

  return NextResponse.json({
    ok: true,
    active: true,
    plan: planName ?? company.plan ?? null,
    subscription_id: activeSub.id,
    locations_allowed: allowed,
    locations_in_use: company.Location.length,
  });
}
