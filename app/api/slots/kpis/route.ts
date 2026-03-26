// app/api/slots/kpis/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const locationId = searchParams.get("locationId");

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId_required" },
        { status: 400 }
      );
    }

    const isAdmin = (user.role ?? "").toLowerCase() === "system_admin";

    if (!isAdmin) {
      const membership = await prisma.userCompany.findFirst({
        where: {
          userId: user.id,
          companyId,
        },
        select: { id: true },
      });

      if (!membership) {
        return NextResponse.json(
          { ok: false, error: "forbidden" },
          { status: 403 }
        );
      }
    }

    const baseWhere: {
      company_id: string;
      location_id?: string;
    } = {
      company_id: companyId,
    };

    if (locationId) {
      baseWhere.location_id = locationId;
    }

const allSlots = await prisma.slot_recovery_slot.findMany({
  where: baseWhere,
  select: {
    id: true,
    status: true,
    company_id: true,
    location_id: true,
  },
});

console.log("[SLOTS_KPIS] companyId:", companyId);
console.log("[SLOTS_KPIS] locationId:", locationId);
console.log("[SLOTS_KPIS] allSlots:", allSlots);

const totalSlots = allSlots.length;
const recoveredSlots = allSlots.filter((slot) => slot.status === "recovered").length;

    return NextResponse.json({
      ok: true,
      kpis: {
        recovered: recoveredSlots,
        recoveredTotal: totalSlots,
      },
    });
  } catch (e) {
    console.error("[GET /api/slots/kpis]", e);

    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}