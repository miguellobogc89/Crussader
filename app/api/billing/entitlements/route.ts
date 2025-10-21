// app/api/billing/entitlements/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserAuth } from "@/lib/authz";

type Source = "TRIAL" | "SUBSCRIPTION" | "MANUAL" | "PROMO";

type CartItem = {
  productId?: string;
  productSlug?: string;
  quantity?: number;
};

type Body = {
  items?: CartItem[];
  bundleSlug?: string;
  source?: Source;
  startAt?: string;
  endAt?: string | null;
};

export async function POST(req: Request) {
  try {
    const { userId } = await getUserAuth();
    const body = (await req.json().catch(() => ({}))) as Body;

    const {
      items = [],
      bundleSlug,
      source = "TRIAL",
      startAt,
      endAt,
    } = body || {};

    // 1) Empresa del usuario
    const uc = await prisma.userCompany.findFirst({
      where: { userId },
      include: { Company: true },
      orderBy: { createdAt: "asc" },
    });
    if (!uc?.Company)
      return NextResponse.json({ ok: false, error: "company_not_found" }, { status: 404 });

    const companyId = uc.companyId;

    // 2) Normalización del carrito
    let bundleLines: { product_id: string; quantity: number }[] = [];
    if (bundleSlug) {
      const bundleParent = await prisma.product.findFirst({
        where: { slug: bundleSlug, active: true },
        select: { id: true },
      });
      if (!bundleParent)
        return NextResponse.json({ ok: false, error: "bundle_not_found_or_inactive" }, { status: 404 });

      const children = await prisma.product_bundle.findMany({
        where: { parent_product_id: bundleParent.id },
        include: {
          product_product_bundle_child_product_idToproduct: {
            select: { id: true, active: true },
          },
        },
      });

      bundleLines = children
        .filter(ch => ch.product_product_bundle_child_product_idToproduct?.active)
        .map(ch => ({
          product_id: ch.child_product_id,
          quantity: ch.quantity ?? 1,
        }));
    }

    const explicitLines: { product_id: string; quantity: number }[] = [];
    for (const line of items) {
      const qty = Number.isFinite(line.quantity) && Number(line.quantity) > 0 ? Number(line.quantity) : 1;

      if (!line.productId && !line.productSlug)
        return NextResponse.json({ ok: false, error: "item_missing_product" }, { status: 400 });

      const prod = await prisma.product.findFirst({
        where: {
          ...(line.productId ? { id: line.productId } : {}),
          ...(line.productSlug ? { slug: line.productSlug } : {}),
          active: true,
        },
        select: { id: true },
      });
      if (!prod)
        return NextResponse.json({ ok: false, error: "product_not_found_or_inactive" }, { status: 404 });

      explicitLines.push({ product_id: prod.id, quantity: qty });
    }

    const aggregated = new Map<string, number>();
    for (const l of [...bundleLines, ...explicitLines]) {
      aggregated.set(l.product_id, (aggregated.get(l.product_id) ?? 0) + l.quantity);
    }

    if (aggregated.size === 0)
      return NextResponse.json({ ok: false, error: "empty_cart" }, { status: 400 });

    const now = new Date();
    const globalStart = startAt ? new Date(startAt) : now;
    const globalEnd = typeof endAt === "string" ? new Date(endAt) : (endAt === null ? null : undefined);

    const results: Array<{
      productId: string;
      quantity: number;
      action: "created" | "extended" | "exists";
      entitlementId: string;
      startAt: string;
      endAt: string | null;
    }> = [];

    // 3) Crear / actualizar entitlements
    for (const [productId, qty] of aggregated.entries()) {
      const prod = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true, trial_days: true },
      });
      if (!prod) continue;

      const start = globalStart;
      let end: Date | null;

      if (globalEnd !== undefined) {
        end = globalEnd;
      } else if (source === "TRIAL") {
        const days = typeof prod.trial_days === "number" && prod.trial_days > 0 ? prod.trial_days : 7;
        end = new Date(start);
        end.setDate(end.getDate() + days);
      } else {
        end = null;
      }

      const existing = await prisma.entitlement.findFirst({
        where: {
          company_id: companyId,
          product_id: productId,
          source,
          active: true,
          OR: [{ end_at: null }, { end_at: { gt: now } }],
        },
        orderBy: { created_at: "desc" },
      });

      if (existing) {
        const shouldExtend =
          (end && existing.end_at && end > existing.end_at) || qty !== existing.quantity;

        if (shouldExtend) {
          const updated = await prisma.entitlement.update({
            where: { id: existing.id },
            data: {
              ...(end !== undefined ? { end_at: end } : {}),
              quantity: qty,
            },
          });
          results.push({
            productId,
            quantity: qty,
            action: "extended",
            entitlementId: updated.id,
            startAt: updated.start_at.toISOString(),
            endAt: updated.end_at ? updated.end_at.toISOString() : null,
          });
        } else {
          results.push({
            productId,
            quantity: existing.quantity,
            action: "exists",
            entitlementId: existing.id,
            startAt: existing.start_at.toISOString(),
            endAt: existing.end_at ? existing.end_at.toISOString() : null,
          });
        }
        continue;
      }

      const created = await prisma.entitlement.create({
        data: {
          company_id: companyId,
          product_id: productId,
          source,
          quantity: qty,
          active: true,
          start_at: start,
          end_at: end ?? null,
          meta: {},
        },
      });

      results.push({
        productId,
        quantity: qty,
        action: "created",
        entitlementId: created.id,
        startAt: created.start_at.toISOString(),
        endAt: created.end_at ? created.end_at.toISOString() : null,
      });
    }

    // 4) Actualizar la cuenta si es trial
    if (source === "TRIAL" && results.length > 0) {
      const trialStart = new Date(Math.min(...results.map(r => new Date(r.startAt).getTime())));
      const trialEndCandidates = results
        .map(r => (r.endAt ? new Date(r.endAt).getTime() : null))
        .filter((t): t is number => t !== null);
      const trialEnd = trialEndCandidates.length
        ? new Date(Math.max(...trialEndCandidates))
        : null;

      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { account_id: true },
      });

      if (company?.account_id) {
        await prisma.account.update({
          where: { id: company.account_id },
          data: {
            trial_start_at: trialStart,
            trial_end_at: trialEnd,
            trial_used: true,
          },
        });
      }
    }

    return NextResponse.json({ ok: true, items: results }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "entitlements_cart_failed" },
      { status: 500 },
    );
  }
}
