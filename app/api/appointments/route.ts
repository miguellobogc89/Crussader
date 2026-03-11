// app/api/appointments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

/**
 * GET /api/appointments?companyId=...
 * Devuelve citas de todas las locations de la empresa
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId_required" },
        { status: 400 }
      );
    }

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

    /**
     * buscamos citas a través de locations de la empresa
     */

const appointments = await prisma.appointment.findMany({
  where: {
    location: {
      companyId,
    },
  },
  select: {
    id: true,
    locationId: true,
    serviceId: true,
    startAt: true,
    endAt: true,
    status: true,
    customerName: true,
    customerPhone: true,
    customerEmail: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
    cancellation_reason: true,
  },
  orderBy: {
    startAt: "asc",
  },
  take: 100,
});

return NextResponse.json({
  ok: true,
  appointments,
});


  } catch (e) {
    console.error("[GET /api/appointments]", e);

    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}