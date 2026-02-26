// app/api/whatsapp/templates/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/whatsapp/templates?companyId=...
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ ok: false, error: "companyId requerido" }, { status: 400 });
    }

    const items = await prisma.whatsapp_template.findMany({
      where: { company_id: companyId },
      orderBy: { updated_at: "desc" },
      select: {
        id: true,
        template_name: true,
        title: true,
        status: true,
        category: true,
        language: true,
        use_type: true,
        body_preview: true,
        updated_at: true,
        is_favorite: true,
        favorite_at: true,
      },
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Error al listar plantillas" },
      { status: 500 }
    );
  }
}