// app/api/slots/template/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId_required" },
        { status: 400 }
      );
    }

    const template = await prisma.whatsapp_template.findFirst({
      where: {
        company_id: companyId,
        template_name: "slot_available_employee ",
        status: "approved",
      },
      select: {
        template_name: true,
        language: true,
        body_preview: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        { ok: false, error: "template_not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      template,
    });
  } catch (error) {
    console.error("GET /api/slots/template error", error);

    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}