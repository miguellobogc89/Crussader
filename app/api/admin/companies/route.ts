// app/api/admin/companies/route
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const cq = searchParams.get("cq") || "";
    const cpage = parseInt(searchParams.get("cpage") || "1", 10);
    const takeParam = parseInt(searchParams.get("take") || "10", 10); // 🆕
    const take = Math.max(1, Math.min(takeParam, 100)); // 🆕 límite defensivo

    const page = Math.max(1, cpage);
    const skip = (page - 1) * take;

    const where = cq
      ? { name: { contains: cq, mode: "insensitive" as const } }
      : {};

    const [total, companies] = await Promise.all([
      prisma.company.count({ where }),
      prisma.company.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: {
            select: {
              UserCompany: true,
              Location: true,
              Reviews: true,
            },
          },
        },
        skip,
        take,
      }),
    ]);

    const pages = Math.max(1, Math.ceil(total / take));

    return NextResponse.json({ ok: true, total, companies, page, pages });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
