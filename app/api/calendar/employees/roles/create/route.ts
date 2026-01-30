// app/api/calendar/employees/roles/create/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

function slugify(input: string) {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\-]/g, "")
    .replace(/\-+/g, "-")
    .replace(/^\-+|\-+$/g, "");
  return s;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const nameRaw = body?.name;
    const colorRaw = body?.color;

    if (typeof nameRaw !== "string") {
      return NextResponse.json({ ok: false, error: "name requerido" }, { status: 400 });
    }

    const name = nameRaw.trim();
    if (!name) {
      return NextResponse.json({ ok: false, error: "name requerido" }, { status: 400 });
    }

    if (name.length > 80) {
      return NextResponse.json({ ok: false, error: "name demasiado largo" }, { status: 400 });
    }

    const slug = slugify(name);
    if (!slug) {
      return NextResponse.json({ ok: false, error: "name inválido" }, { status: 400 });
    }

    let color: string | null = null;
    if (typeof colorRaw === "string") {
      const c = colorRaw.trim();
      if (c) color = c;
    }

    // si ya existe el slug, lo reutilizamos (y lo reactivamos si estaba inactive)
    const role = await prisma.staffRole.upsert({
      where: { slug },
      update: {
        name,
        color,
        active: true,
      },
      create: {
        name,
        slug,
        color,
        active: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        color: true,
        active: true,
      },
    });

    return NextResponse.json({ ok: true, item: role });
  } catch {
    return NextResponse.json({ ok: false, error: "Error creando rol" }, { status: 500 });
  }
}
