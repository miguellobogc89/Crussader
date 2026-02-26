// app/api/whatsapp/templates/defaults/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  inferTemplateGroupKey,
  QUICK_ACTIONS,
  type TemplateGroupKey,
} from "@/lib/whatsapp/templateGroups";

export const dynamic = "force-dynamic";

/**
 * GET /api/whatsapp/templates/defaults?companyId=...
 * Devuelve la plantilla "default" por grupo (favorita si existe; si no, fallback).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ ok: false, error: "companyId requerido" }, { status: 400 });
    }

    const templates = await prisma.whatsapp_template.findMany({
      where: { company_id: companyId },
      orderBy: [{ is_favorite: "desc" }, { updated_at: "desc" }],
      select: {
        id: true,
        template_name: true,
        title: true,
        status: true,
        category: true,
        language: true,
        use_type: true,
        body_preview: true,
        is_favorite: true,
        updated_at: true,
      },
    });

    const byGroup = new Map<TemplateGroupKey, typeof templates>();

    for (const t of templates) {
      const key = inferTemplateGroupKey(t.template_name);
      const arr = byGroup.get(key);
      if (arr) arr.push(t);
      else byGroup.set(key, [t]);
    }

    const defaults: Record<string, any> = {};

    for (const a of QUICK_ACTIONS) {
      const list = byGroup.get(a.key) || [];

      // 1) favorita
      let chosen = list.find((x) => x.is_favorite === true);

      // 2) fallback: approved
      if (!chosen) {
        chosen = list.find((x) => x.status === "approved");
      }

      // 3) fallback: la más reciente (ya viene ordenado)
      if (!chosen && list.length > 0) {
        chosen = list[0];
      }

      defaults[a.key] = chosen ? chosen : null;
    }

    return NextResponse.json({ ok: true, defaults });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Error cargando defaults" },
      { status: 500 }
    );
  }
}