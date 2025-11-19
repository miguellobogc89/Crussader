// app/api/mybusiness/company/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { ok: false, error: "NO_SESSION", company: null },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Última company creada por este usuario
    const company = await prisma.company.findFirst({
      where: { createdById: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        company: company ?? null,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[company/status] Error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "INTERNAL_ERROR",
        message: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
