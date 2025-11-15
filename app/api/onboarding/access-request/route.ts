// app/api/onboarding/access-request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { sendAccessRequestEmail } from "@/lib/email";
import { OnboardingStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { emails, requesterName, requesterEmail } = await req.json();

    const toEmails: string[] = Array.isArray(emails)
      ? emails
          .map((e: unknown) => String(e ?? "").trim())
          .filter((e: string) => e.length > 0)
      : [];

    if (!toEmails.length) {
      return NextResponse.json(
        { ok: false, error: "NO_EMAILS" },
        { status: 400 }
      );
    }

    const safeRequesterName =
      typeof requesterName === "string" && requesterName.trim().length > 0
        ? requesterName.trim()
        : "Usuario";

    const safeRequesterEmail =
      typeof requesterEmail === "string" && requesterEmail.trim().length > 0
        ? requesterEmail.trim()
        : "desconocido@correo.com";

    const origin = req.nextUrl.origin;

    // Usuario que SOLICITA acceso (por email)
    const requesterUser = await prisma.user.findFirst({
      where: { email: safeRequesterEmail },
      select: { id: true },
    });

    if (!requesterUser) {
      console.warn(
        "[access-request] requester email no vinculado a ningún usuario:",
        safeRequesterEmail
      );
    }

    // Enviar un correo POR destinatario, con su propio approveUrl
    for (const raw of toEmails) {
      const to = raw.trim();
      if (!to) continue;

      let approveUrl = origin;

      if (requesterUser) {
        // Usuario que RECIBE el correo (posible aprobador)
        const approver = await prisma.user.findFirst({
          where: { email: to },
          select: {
            id: true,
            UserCompany: {
              select: { companyId: true, createdAt: true },
              orderBy: { createdAt: "asc" },
              take: 1,
            },
          },
        });

        const companyId =
          approver?.UserCompany && approver.UserCompany.length > 0
            ? approver.UserCompany[0].companyId
            : null;

        if (companyId) {
          // Enlace que asignará al solicitante a LA COMPANY del aprobador
          approveUrl = `${origin}/api/onboarding/access-approve?userId=${encodeURIComponent(
            requesterUser.id
          )}&companyId=${encodeURIComponent(companyId)}`;
        } else {
          // Fallback: sin company, al menos aprobará el onboarding
          approveUrl = `${origin}/api/onboarding/access-approve?userId=${encodeURIComponent(
            requesterUser.id
          )}`;
        }
      }

      await sendAccessRequestEmail({
        to,
        requesterName: safeRequesterName,
        requesterEmail: safeRequesterEmail,
        approveUrl,
      });
    }

    // Actualizar estado de onboarding del solicitante (si lo encontramos)
    if (requesterUser) {
      await prisma.user.update({
        where: { id: requesterUser.id },
        data: {
          onboardingStatus: OnboardingStatus.REQUEST_SENT,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[access-request] Error:", err);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
