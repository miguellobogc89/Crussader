// app/api/billing/entitlements/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Body = {
  source: "TRIAL" | "SUBSCRIPTION" | "MANUAL" | "PROMO";
  items: { productSlug: string; quantity: number }[];
};

export async function POST(req: Request) {
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

    if (!user.account_id) {
      // Si esto pasa, /api/billing/account no ha corrido bien antes
      return NextResponse.json(
        { ok: false, error: "NO_ACCOUNT_FOR_USER" },
        { status: 400 }
      );
    }

    const accountId = user.account_id;
    const body = (await req.json()) as Body;

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { ok: false, error: "NO_ITEMS" },
        { status: 400 }
      );
    }

    const now = new Date();

    for (const item of body.items) {
      if (!item.productSlug || item.quantity <= 0) continue;

      const product = await prisma.product.findFirst({
        where: {
          slug: item.productSlug,
          active: true,
          visible: true,
        },
        select: { id: true },
      });

      if (!product) {
        console.warn(
          "[billing/entitlements] product not found for slug:",
          item.productSlug
        );
        continue;
      }

      // Si ya hay un entitlement activo para esta account+producto+source, sumamos
      const existing = await prisma.entitlement.findFirst({
        where: {
          account_id: accountId,
          product_id: product.id,
          source: body.source,
          active: true,
          OR: [
            { end_at: null },
            { end_at: { gt: now } },
          ],
        },
        orderBy: { created_at: "desc" },
      });

      if (existing) {
        await prisma.entitlement.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + item.quantity,
            updated_at: now,
          },
        });
      } else {
        await prisma.entitlement.create({
          data: {
            account_id: accountId,
            product_id: product.id,
            source: body.source,
            quantity: item.quantity,
            active: true,
            start_at: now,
          },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/billing/entitlements] error:", err);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
