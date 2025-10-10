// app/api/products/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient, Role, CompanyRole } from "@prisma/client";

let prisma: PrismaClient;
declare global { var _prisma: PrismaClient | undefined }
if (!global._prisma) global._prisma = new PrismaClient();
prisma = global._prisma;

export const dynamic = "force-dynamic";

type PriceRow = {
  id: string;
  product_id: string;
  billing_period: "ONCE" | "DAY" | "WEEK" | "MONTH" | "YEAR";
  amount_cents: bigint | number;
  currency: string;
  is_active: boolean;
  started_at: Date;
  ended_at: Date | null;
};

type ProductRow = {
  id: string;
  sku: string | null;
  name: string;
  slug: string | null;
  description: string | null;
  type: "STANDALONE" | "ADDON" | "SEAT" | "USAGE" | "LOCATION";
  visibility: "PUBLIC" | "HIDDEN" | "INTERNAL";
  active: boolean;
  visible: boolean;
  launch_at: Date | null;
  trial_days: number;
  meta: any | null;
};

function toMonthly(pr: PriceRow | undefined | null) {
  return pr ? { amountCents: Number(pr.amount_cents), currency: pr.currency, priceId: pr.id } : null;
}

async function fetchMonthlyMap(productIds: string[]) {
  if (!productIds.length) return new Map<string, PriceRow>();
  const rows = await prisma.price.findMany({
    where: {
      product_id: { in: productIds },
      billing_period: "MONTH",
      is_active: true,
      ended_at: null,
    },
    orderBy: [{ started_at: "desc" }],
  });
  const map = new Map<string, PriceRow>();
  for (const r of rows) if (!map.has(r.product_id)) map.set(r.product_id, r);
  return map;
}

async function attachAddons(baseProducts: ProductRow[]) {
  const baseIds = baseProducts.map(p => p.id);
  if (!baseIds.length) return new Map<string, any[]>();

  const reqs = await prisma.product_requirement.findMany({
    where: { product_id: { in: baseIds } },
    select: { product_id: true, required_product_id: true, per_units: true, required_min_qty: true },
  });

  const childIds = Array.from(new Set(reqs.map(r => r.required_product_id)));
  if (!childIds.length) return new Map<string, any[]>();

  const childProducts = await prisma.product.findMany({
    where: { id: { in: childIds } },
  });

  const monthlyMap = await fetchMonthlyMap(childIds);
  const childMap = new Map(childProducts.map(cp => [cp.id, cp]));

  // group by base product
  const grouped = new Map<string, any[]>();
  for (const r of reqs) {
    const child = childMap.get(r.required_product_id) as unknown as ProductRow | undefined;
    if (!child) continue;
    const monthly = monthlyMap.get(child.id);
    const arr = grouped.get(r.product_id) ?? [];
    arr.push({
      id: child.id,
      sku: child.sku ?? undefined,
      name: child.name,
      slug: child.slug ?? undefined,
      description: child.description ?? undefined,
      type: child.type,
      visibility: child.visibility,
      active: child.active,
      visible: child.visible,
      trialDays: child.trial_days,
      monthlyPrice: toMonthly(monthly),
      meta: child.meta ?? {},
      perUnits: r.per_units,
      minQty: r.required_min_qty,
    });
    grouped.set(r.product_id, arr);
  }
  return grouped;
}

function buildDTO(p: ProductRow, monthly?: PriceRow | null, addonsForThis?: any[]) {
  return {
    id: p.id,
    sku: p.sku ?? undefined,
    name: p.name,
    slug: p.slug ?? undefined,
    description: p.description ?? undefined,
    type: p.type,
    visibility: p.visibility,
    active: p.active,
    visible: p.visible,
    launchAt: p.launch_at ?? undefined,
    trialDays: p.trial_days,
    meta: p.meta ?? {},
    monthlyPrice: toMonthly(monthly ?? null),
    // ✨ nuevos: banner de oferta y “incluye”
    offer: (p.meta?.offer ?? null) || null,      // p.ej. {label:"-20% este mes"}
    includes: (p.meta?.includes ?? null) || null,// p.ej. ["5 usuarios", "1 ubicación"]
    // ✨ add-ons
    addons: addonsForThis ?? [],
  };
}

function isCompanyOwnerOrAdmin(role: CompanyRole) {
  return role === CompanyRole.OWNER || role === CompanyRole.ADMIN;
}

/** Productos (según alcance) y con addons adjuntos */
async function findProductsWithAddons(where: any) {
  const products = await prisma.product.findMany({
    where,
    orderBy: [{ name: "asc" }],
  });
  const ids = products.map(p => p.id);
  const monthlyMap = await fetchMonthlyMap(ids);
  const addonsMap = await attachAddons(products as unknown as ProductRow[]);
  return products.map(p =>
    buildDTO(p as unknown as ProductRow, monthlyMap.get(p.id) ?? null, addonsMap.get(p.id) ?? []),
  );
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
      select: {
        id: true,
        role: true,
        UserCompany: { select: { companyId: true, role: true } },
      },
    });
    if (!user) return NextResponse.json({ ok: false, error: "USER_NOT_FOUND" }, { status: 401 });

    const url = new URL(req.url);
    const scope = url.searchParams.get("scope");
    const companyIdParam = url.searchParams.get("companyId");

    const isAdmin = user.role === Role.system_admin || user.role === Role.org_admin;

    // Admin global
    if (isAdmin) {
      if (scope === "all" || !companyIdParam) {
        const items = await findProductsWithAddons({});
        return NextResponse.json({ ok: true, scope: "all", items });
      }
      // admin filtrando por company: mostramos lo “contratado” (entitlements)
      const ents = await prisma.entitlement.findMany({
        where: {
          company_id: companyIdParam!,
          active: true,
          quantity: { gt: 0 },
          start_at: { lte: new Date() },
          OR: [{ end_at: null }, { end_at: { gt: new Date() } }],
        },
        select: { product_id: true },
      });
      const ids = Array.from(new Set(ents.map(e => e.product_id)));
      const items = await findProductsWithAddons({ id: { in: ids } });
      return NextResponse.json({ ok: true, scope: "company", companyId: companyIdParam, items });
    }

    // Dueño/Admin de compañía
    const manageable = (user.UserCompany ?? [])
      .filter(uc => isCompanyOwnerOrAdmin(uc.role))
      .map(uc => uc.companyId);

    if (!manageable.length)
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });

    if (companyIdParam && !manageable.includes(companyIdParam)) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN_COMPANY" }, { status: 403 });
    }

    const companyIds = companyIdParam ? [companyIdParam] : manageable;
    const ents = await prisma.entitlement.findMany({
      where: {
        company_id: { in: companyIds },
        active: true,
        quantity: { gt: 0 },
        start_at: { lte: new Date() },
        OR: [{ end_at: null }, { end_at: { gt: new Date() } }],
      },
      select: { product_id: true },
    });
    const ids = Array.from(new Set(ents.map(e => e.product_id)));
    const items = await findProductsWithAddons({ id: { in: ids } });
    return NextResponse.json({ ok: true, scope: "companies", companyIds, items });
  } catch (err) {
    console.error("[GET /api/products] error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
