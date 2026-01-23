// app/api/reviews/response/auto-publish/[companyId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "missing_company_id" },
        { status: 400 }
      );
    }

    const existing = await prisma.responseSettings.findUnique({
      where: { companyId },
    });

    return NextResponse.json({ ok: true, settings: existing });
  } catch (err) {
    console.error("AUTO-PUBLISH GET ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const body = await req.json().catch(() => null);

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "missing_company_id" },
        { status: 400 }
      );
    }

    if (!body || !body.mode) {
      return NextResponse.json(
        { ok: false, error: "missing_payload" },
        { status: 400 }
      );
    }

    const mode = body.mode as "positives" | "mixed" | "manual";

    // MVP: WhatsApp siempre false (mock)
    const nextAutoPublish = {
      mode,
      whatsappNotifyEnabled: false,
    };

    const existing = await prisma.responseSettings.findUnique({
      where: { companyId },
    });

    if (!existing) {
      const created = await prisma.responseSettings.create({
        data: {
          companyId,
          config: {
            autoPublish: nextAutoPublish,
          },
        },
      });

      return NextResponse.json({ ok: true, settings: created });
    }

    const mergedConfig = {
      ...(existing.config as any),
      autoPublish: nextAutoPublish,
    };

    const updated = await prisma.responseSettings.update({
      where: { companyId },
      data: {
        config: mergedConfig,
      },
    });

    return NextResponse.json({ ok: true, settings: updated });
  } catch (err) {
    console.error("AUTO-PUBLISH UPDATE ERROR:", err);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
