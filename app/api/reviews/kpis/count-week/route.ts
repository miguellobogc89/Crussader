// app/api/reviews/kpis/count-week/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const companyId = searchParams.get("companyId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!companyId || !from || !to) {
      return NextResponse.json(
        { ok: false, error: "Missing parameters" },
        { status: 400 },
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return NextResponse.json(
        { ok: false, error: "Invalid date format" },
        { status: 400 },
      );
    }

    const count = await prisma.review.count({
      where: {
        companyId,
        createdAtG: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      count,
    });
  } catch (error) {
    console.error("count-week error", error);
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 },
    );
  }
}
