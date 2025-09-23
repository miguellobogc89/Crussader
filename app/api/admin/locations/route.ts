// app/api/admin/locations/route
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lq = searchParams.get("lq") ?? "";
    const lpage = Number(searchParams.get("lpage") ?? "1");
    const takeParam = Number(searchParams.get("take") ?? "10");
    const take = Math.max(1, Math.min(takeParam, 100)); // límite razonable

    const page = Math.max(1, Number.isFinite(lpage) ? lpage : 1);
    const skip = (page - 1) * take;

    const where: Prisma.LocationWhereInput = lq
      ? {
          OR: [
            { title: { contains: lq, mode: "insensitive" } },
            { company: { name: { contains: lq, mode: "insensitive" } } },
            { city: { contains: lq, mode: "insensitive" } },
            { country: { contains: lq, mode: "insensitive" } },
            { type: { name: { contains: lq, mode: "insensitive" } } },
            { activity: { name: { contains: lq, mode: "insensitive" } } },
          ],
        }
      : {};

    const [total, locations] = await Promise.all([
      prisma.location.count({ where }),
      prisma.location.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          address: true,
          city: true,
          postalCode: true,
          type: { select: { name: true } },
          activity: { select: { name: true } },
          status: true,
          createdAt: true,
          lastSyncAt: true,
          googlePlaceId: true,
          reviewsAvg: true,
          reviewsCount: true,
          company: { select: { id: true, name: true } },
          ExternalConnection: { select: { id: true } },
        },
        skip,
        take,
      }),
    ]);

    const pages = Math.max(1, Math.ceil(total / take));

    return NextResponse.json({
      ok: true,
      total,
      pages,
      page,
      take,
      locations,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unknown_error" },
      { status: 500 }
    );
  }
}
