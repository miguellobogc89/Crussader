// app/api/onboarding/access-request/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { sendAccessRequestEmail } from "@/lib/email";
import { OnboardingStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { emails, requesterName, requesterEmail } = await req.json();

    // Normalizamos lista de correos introducidos por el usuario
    const rawEmails: string[] = Array.isArray(emails)
      ? emails
          .map((e: unknown) => String(e ?? "").trim())
          .filter((e: string) => e.length > 0)
      : [];

    if (!rawEmails.length) {
      return NextResponse.json(
        { ok: false, error: "NO_EMAILS" },
        { status: 400 }
      );
    }

    // Quitamos duplicados manteniendo orden
    const toEmails = Array.from(new Set(rawEmails));

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
      // aun así devolvemos ok para no romper onboarding visualmente
    }

    // ============================
    // Recorremos TODOS los correos:
    //   - solo usuarios activos y no suspendidos
    //   - solo si tienen al menos una company
    //   - un email -> un approveUrl con (userId + companyId)
    // ============================

    if (requesterUser) {
      for (const email of toEmails) {
        const approver = await prisma.user.findFirst({
          where: {
            email,
            isActive: true,
            isSuspended: false,
          },
          select: {
            id: true,
            UserCompany: {
              select: { companyId: true, createdAt: true },
              orderBy: { createdAt: "asc" },
              take: 1, // si tiene varias empresas, usamos la primera (más antigua)
            },
          },
        });

        if (!approver) {
          continue; // sin usuario válido para este email
        }

        if (!approver.UserCompany || approver.UserCompany.length === 0) {
          continue; // usuario sin empresa -> no sirve como aprobador
        }

        const companyId = approver.UserCompany[0].companyId;

        const approveUrl = `${origin}/api/onboarding/access-approve?userId=${encodeURIComponent(
          requesterUser.id
        )}&companyId=${encodeURIComponent(companyId)}`;

        await sendAccessRequestEmail({
          to: email,
          requesterName: safeRequesterName,
          requesterEmail: safeRequesterEmail,
          approveUrl,
        });
      }
    } else {
      console.warn(
        "[access-request] No requesterUser, se omite envío de correos."
      );
    }

    // Actualizar estado de onboarding del solicitante (si existe)
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
