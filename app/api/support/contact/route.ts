// app/api/support/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Resend } from "resend";
import { sendSupportConfirmationEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email ?? null;
    const userName = session?.user?.name ?? null;

    const body = (await req.json().catch(() => null)) as
      | { subject?: string; message?: string }
      | null;

    const subject = body?.subject?.trim();
    const message = body?.message?.trim();

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Missing subject or message" },
        { status: 400 },
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY is missing");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 },
      );
    }

    const fullSubject = `[Crussader Soporte] ${subject}`;

    const metaLine = userEmail
      ? `Usuario: ${userName ?? ""} <${userEmail}>`
      : "Usuario no autenticado";

    const html = `
      <div style="font-family: system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; line-height: 1.5; color: #0f172a;">
        <h1 style="font-size: 20px; margin-bottom: 4px;">Nuevo mensaje de soporte</h1>
        <p style="margin: 0 0 16px; color: #64748b;">${metaLine}</p>

        <h2 style="font-size: 16px; margin: 16px 0 8px;">Asunto</h2>
        <p style="margin: 0 0 16px;">${subject}</p>

        <h2 style="font-size: 16px; margin: 16px 0 8px;">Mensaje</h2>
        <pre
          style="
            margin: 0;
            padding: 12px 14px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            white-space: pre-wrap;
            font-size: 14px;
          "
        >${message}</pre>
      </div>
    `;

    // Email interno al equipo
    await resend.emails.send({
      from: "Crussader Soporte <soporte@crussader.com>",
      to: ["info@crussader.com", "miguel.lobogc.89@gmail.com"],
      subject: fullSubject,
      html,
      replyTo: userEmail ?? undefined,
    });

    // Email de confirmación al usuario (no rompe el flujo si falla)
    if (userEmail) {
      try {
        await sendSupportConfirmationEmail({
          to: userEmail,
          originalSubject: subject,
        });
      } catch (error) {
        console.error(
          "⚠️ Error al enviar email de confirmación de soporte al usuario:",
          error,
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("❌ Error en /api/support/contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
