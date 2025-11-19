// app/api/mybusiness/company/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/app/server/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { ok: false, error: "NO_SESSION", company: null },
        { status: 401 },
      );
    }

    const userId = (session.user as any).id as string;

    // Última relación UserCompany creada para este usuario
    const uc = await prisma.userCompany.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        Company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!uc || !uc.Company) {
      return NextResponse.json(
        { ok: true, company: null },
        { status: 200 },
      );
    }

    const company = {
      id: uc.Company.id,
      name: uc.Company.name,
    };

    return NextResponse.json(
      {
        ok: true,
        company,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[/api/mybusiness/company] Error:", err);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR", company: null },
      { status: 500 },
    );
  }
}
