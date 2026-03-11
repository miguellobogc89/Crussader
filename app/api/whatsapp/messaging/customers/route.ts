// app/api/whatsapp/messaging/customers/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const companyId = searchParams.get("companyId");
  const limitRaw = searchParams.get("limit") || "100";

  if (!companyId) {
    return NextResponse.json({ ok: false, error: "Missing companyId" }, { status: 400 });
  }

  const limit = Number(limitRaw);
  const take = Number.isFinite(limit) && limit > 0 && limit <= 500 ? limit : 100;

  // customers vinculados a la company vía CompanyCustomer
  const rows = await prisma.companyCustomer.findMany({
    where: { companyId },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          updatedAt: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  const items = rows
    .map((r) => r.customer)
    .filter((c) => c && typeof c.phone === "string" && c.phone.length > 0)
    .map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName}`.trim(),
      phone: c.phone,
      email: c.email,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

  return NextResponse.json({ ok: true, items });
}