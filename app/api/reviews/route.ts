// app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserAuth, assertCompanyMember } from "@/lib/authz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { userId, isAdmin } = await getUserAuth();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
    const take = Math.min(50, Math.max(1, Number(searchParams.get("take") ?? 20) || 20));
    const skip = (page - 1) * take;

    const q = (searchParams.get("q") ?? "").trim();
    const companyId = (searchParams.get("companyId") ?? "").trim();
    const locationId = (searchParams.get("locationId") ?? "").trim();

    // Si viene locationId y no eres admin, valida pertenencia a la empresa de esa location
    if (locationId && !isAdmin) {
      const loc = await prisma.location.findUnique({
        where: { id: locationId },
        select: { companyId: true },
      });
      if (!loc) {
        return NextResponse.json({ ok: false, error: "location_not_found" }, { status: 404 });
      }
      await assertCompanyMember(loc.companyId, userId, isAdmin);
    }

    const where = {
      ...(q
        ? {
            OR: [
              { reviewerName: { contains: q, mode: "insensitive" as const } },
              { comment: { contains: q, mode: "insensitive" as const } },
              { Company: { name: { contains: q, mode: "insensitive" as const } } },
              { Location: { title: { contains: q, mode: "insensitive" as const } } },
            ],
          }
        : {}),
      ...(companyId ? { companyId } : {}),
      ...(locationId ? { locationId } : {}),
      // Privacidad: si no eres admin, solo reviews de compañías donde perteneces
      ...(isAdmin
        ? {}
        : {
            Company: {
              UserCompany: { some: { userId } },
            },
          }),
    };

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy: [{ createdAtG: "desc" as const }, { ingestedAt: "desc" as const }],
        select: {
          id: true,
          companyId: true,
          locationId: true,
          provider: true,
          externalId: true,
          reviewerName: true,
          reviewerAnon: true,
          rating: true,
          comment: true,
          createdAtG: true,
          Location: { select: { title: true } },
          Company: { select: { name: true } },
        },
        skip,
        take,
      }),
    ]);

    return NextResponse.json({ ok: true, page, take, total, reviews });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json({ ok: false, error: e?.message ?? "internal_error" }, { status });
  }
}
