import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
declare global { var _prisma: PrismaClient | undefined }
if (!global._prisma) global._prisma = new PrismaClient();
prisma = global._prisma;

export const dynamic = "force-dynamic";

/** Convierte BigInt/Decimal a tipos serializables */
function serializePrice(pr: any) {
  return {
    ...pr,
    amount_cents: pr.amount_cents != null ? Number(pr.amount_cents) : pr.amount_cents,
    // Prisma Decimal -> Number para JSON
    // (si añadieras campos Decimal extra aquí, conviértelos igual con Number())
  };
}

function serializeProductRequirement(req: any) {
  return {
    ...req,
    // incluímos el producto relacionado totalmente (se serializa más abajo con pick básico)
    product_parent: req.product_product_requirement_product_idToproduct
      ? serializeProductMinimal(req.product_product_requirement_product_idToproduct)
      : undefined,
    product_required: req.product_product_requirement_required_product_idToproduct
      ? serializeProductMinimal(req.product_product_requirement_required_product_idToproduct)
      : undefined,
  };
}

function serializeProductMinimal(p: any) {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    type: p.type,
    visibility: p.visibility,
    active: p.active,
    visible: p.visible,
    launch_at: p.launch_at,
    trial_days: p.trial_days,
    meta: p.meta,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

function serializeFullProduct(p: any) {
  return {
    // Todos los campos de product
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    description: p.description,
    type: p.type,
    visibility: p.visibility,
    active: p.active,
    visible: p.visible,
    launch_at: p.launch_at,
    trial_days: p.trial_days,
    meta: p.meta,
    created_at: p.created_at,
    updated_at: p.updated_at,

    // Todos los prices del producto
    prices: (p.price ?? []).map(serializePrice),

    // Requisitos donde este producto es el PADRE (product_id = this.id)
    requirements: (p.product_requirement_product_requirement_product_idToproduct ?? []).map(
      (req: any) =>
        serializeProductRequirement({
          ...req,
          // añadimos alias legibles del lado padre/hijo
          product_product_requirement_product_idToproduct: p,
          // ya viene incluido el "required" por el include
        }),
    ),

    // Requisitos donde este producto es el REQUERIDO (required_product_id = this.id)
    requiredBy: (p.product_requirement_product_requirement_required_product_idToproduct ?? []).map(
      (req: any) => serializeProductRequirement(req),
    ),
  };
}

export async function GET() {
  try {
    // Si necesitas auth, mantenla; si no, puedes devolver sin sesión.
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      orderBy: [{ name: "asc" }],
      include: {
        // todos los prices de cada producto
        price: true,

        // reqs donde este producto es el padre (product_id)
        product_requirement_product_requirement_product_idToproduct: {
          include: {
            // incluimos el producto requerido
            product_product_requirement_required_product_idToproduct: true,
          },
        },

        // reqs donde este producto es el requerido (required_product_id)
        product_requirement_product_requirement_required_product_idToproduct: {
          include: {
            // incluimos el producto padre
            product_product_requirement_product_idToproduct: true,
          },
        },
      },
    });

    const items = products.map(serializeFullProduct);
    return NextResponse.json({ ok: true, items });
  } catch (err) {
    console.error("[GET /api/products] error:", err);
    return NextResponse.json({ ok: false, error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
