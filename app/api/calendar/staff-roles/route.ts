// app/api/calendar/staff-roles/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
declare global { var _prisma: PrismaClient | undefined }
if (!global._prisma) global._prisma = new PrismaClient();
prisma = global._prisma;

export const dynamic = "force-dynamic";

/* Util: slugify simple */
function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFD").replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "rol"
  );
}

/**
 * GET → lista de roles activos (catálogo), similar a /locations
 * Opcional: ?q=texto para filtrar por nombre/slug
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();

    const where: any = { active: true };
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    }

    const items = await prisma.staffRole.findMany({
      where,
      select: { id: true, name: true, slug: true, color: true, active: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ ok: true, items });
  } catch (err: any) {
    console.error("[staff-roles.list] error", err);
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}

/**
 * POST → crea un rol (name obligatorio, color opcional). Genera slug único.
 * body: { name: string; color?: string; slug?: string }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: "Missing name" }, { status: 400 });
    }
    const color = body?.color ? String(body.color) : null;
    let slug = String(body?.slug ?? "").trim() || slugify(name);

    // Unicidad del slug
    let uniqueSlug = slug;
    let i = 1;
    while (await prisma.staffRole.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slug}-${++i}`;
    }

    const created = await prisma.staffRole.create({
      data: { name, slug: uniqueSlug, color, active: true },
      select: { id: true, name: true, slug: true, color: true, active: true },
    });

    return NextResponse.json({ ok: true, item: created }, { status: 201 });
  } catch (err: any) {
    console.error("[staff-roles.create] error", err);
    return NextResponse.json({ ok: false, error: err?.message || "Create failed" }, { status: 500 });
  }
}






// GET y POST: deja tus handlers tal cual...

/**
 * PATCH → actualiza campos de un rol (parcial).
 * body: { id: string; name?: string; color?: string | null; active?: boolean; slug?: string }
 * - si viene 'slug', se comprueba unicidad.
 * - si no viene 'slug', NO se toca (aunque cambie el nombre).
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = String(body?.id ?? "");
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    const data: any = {};
    if (typeof body?.name === "string") {
      const name = body.name.trim();
      if (!name) return NextResponse.json({ ok: false, error: "Invalid name" }, { status: 400 });
      data.name = name;
    }
    if (typeof body?.active === "boolean") data.active = !!body.active;

    if (body?.color === null) data.color = null;
    else if (typeof body?.color === "string" && body.color.trim()) {
      const hex = body.color.startsWith("#") ? body.color : `#${body.color}`;
      data.color = hex;
    }

    if (typeof body?.slug === "string") {
      let desired = body.slug.trim() || (data.name ? slugify(data.name) : undefined);
      if (desired) {
        let unique = desired;
        let i = 1;
        const current = await prisma.staffRole.findUnique({ where: { id }, select: { id: true, slug: true } });
        while (true) {
          const exists = await prisma.staffRole.findUnique({ where: { slug: unique } });
          if (!exists || exists.id === id) break;
          unique = `${desired}-${++i}`;
        }
        data.slug = unique;
      }
    }

    const updated = await prisma.staffRole.update({
      where: { id },
      data,
      select: { id: true, name: true, slug: true, color: true, active: true },
    });

    return NextResponse.json({ ok: true, item: updated });
  } catch (err: any) {
    console.error("[staff-roles.update] error", err);
    return NextResponse.json({ ok: false, error: err?.message || "Update failed" }, { status: 500 });
  }
}
