// app/api/billing/account/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserAuth } from "@/lib/authz";

function toSlug(s: string) {
  return (s || "mi-cuenta")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function POST() {
  try {
    const { userId } = await getUserAuth();

    // 1) Empresa del usuario
    const uc = await prisma.userCompany.findFirst({
      where: { userId },
      include: { Company: true, User: true },
      orderBy: { createdAt: "asc" },
    });
    if (!uc?.Company) {
      return NextResponse.json({ ok: false, error: "company_not_found" }, { status: 404 });
    }
    const company = uc.Company;
    const user = uc.User;

    // 2) Si ya hay account enlazada a Company → úsala
    if (company.account_id) {
      return NextResponse.json({ ok: true, accountId: company.account_id, created: false }, { status: 200 });
    }

    // 3) Si el user ya tiene account_id (y existe), enlazamos también la Company
    if (user.account_id) {
      const existing = await prisma.account.findUnique({ where: { id: user.account_id } });
      if (existing) {
        await prisma.company.update({
          where: { id: company.id },
          data: { account_id: existing.id },
        });
        return NextResponse.json({ ok: true, accountId: existing.id, created: false }, { status: 200 });
      }
    }

    // 4) Crear account nueva (sin plan ni producto)
    const baseSlug = toSlug(company.name || user?.email || "mi-cuenta");
    let slug = baseSlug;

    const conflict = await prisma.account.findFirst({
      where: { slug: { equals: slug, mode: "insensitive" } },
      select: { id: true },
    });
    if (conflict) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const created = await prisma.account.create({
      data: {
        name: company.name || user?.email || "Mi cuenta",
        slug,
        owner_user_id: userId,
        status: "active",
        // No seteamos plan_slug ni fechas aquí para no “ensuciar” con producto
      },
    });

    // 5) Enlazar en User y Company
    await Promise.all([
      prisma.user.update({ where: { id: userId }, data: { account_id: created.id } }),
      prisma.company.update({ where: { id: company.id }, data: { account_id: created.id } }),
    ]);

    return NextResponse.json({ ok: true, accountId: created.id, created: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "account_init_failed" }, { status: 500 });
  }
}
