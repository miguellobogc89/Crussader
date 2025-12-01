// app/api/onboarding/access-approved/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { OnboardingStatus, CompanyRole } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const requesterUserId = url.searchParams.get("userId");
    const companyId = url.searchParams.get("companyId");

    if (!requesterUserId) {
      return NextResponse.json(
        { ok: false, error: "MISSING_USER_ID" },
        { status: 400 }
      );
    }

    const requesterUser = await prisma.user.findUnique({
      where: { id: requesterUserId },
      select: { id: true },
    });

    if (!requesterUser) {
      return NextResponse.json(
        { ok: false, error: "REQUESTER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Si viene companyId, asignamos al usuario a esa empresa
    if (companyId) {
      await prisma.userCompany.upsert({
        where: {
          userId_companyId: {
            userId: requesterUserId,
            companyId,
          },
        },
        create: {
          userId: requesterUserId,
          companyId,
          role: CompanyRole.MEMBER,
        },
        update: {},
      });
    }

    // Marcamos onboarding como completado
    await prisma.user.update({
      where: { id: requesterUserId },
      data: {
        onboardingStatus: OnboardingStatus.COMPLETED,
      },
    });

    // ✅ Redirigir a una página bonita
    const redirectUrl = new URL("/dashboard/onboarding/access-approved", url.origin);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[access-approved] Error:", err);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
