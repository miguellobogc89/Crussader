import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  // TODO: auth/permissions
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const companies = await prisma.company.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
    take: 500, // ajusta límite
  });

  return NextResponse.json(companies);
}
