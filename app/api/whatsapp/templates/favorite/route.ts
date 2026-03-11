// app/api/whatsapp/templates/favorite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inferTemplateGroupKey } from "@/lib/whatsapp/templateGroups";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function isRetryableTxError(e: unknown) {
  // SERIALIZABLE can throw P2034 (write conflict / deadlock)
  if (e && typeof e === "object" && "code" in e) {
    return (e as any).code === "P2034";
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
    }

    const companyId = typeof body.companyId === "string" ? body.companyId : "";
    const templateId = typeof body.templateId === "string" ? body.templateId : "";
    const isFavorite = body.isFavorite === true;

    if (!companyId) return NextResponse.json({ ok: false, error: "companyId requerido" }, { status: 400 });
    if (!templateId) return NextResponse.json({ ok: false, error: "templateId requerido" }, { status: 400 });

    const t = await prisma.whatsapp_template.findFirst({
      where: { id: templateId, company_id: companyId },
      select: { id: true, template_name: true },
    });

    if (!t) return NextResponse.json({ ok: false, error: "Template not found" }, { status: 404 });

    const groupKey = inferTemplateGroupKey(t.template_name);

    const MAX_RETRIES = 3;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await prisma.$transaction(
          async (tx) => {
            if (isFavorite) {
              // Solo traemos favoritos (mucho menos volumen)
              const favorites = await tx.whatsapp_template.findMany({
                where: { company_id: companyId, is_favorite: true },
                select: { id: true, template_name: true },
              });

              const toUnfavorite: string[] = [];
              for (const x of favorites) {
                if (x.id === templateId) continue;
                const k = inferTemplateGroupKey(x.template_name);
                if (k === groupKey) toUnfavorite.push(x.id);
              }

              if (toUnfavorite.length > 0) {
                await tx.whatsapp_template.updateMany({
                  where: { company_id: companyId, id: { in: toUnfavorite } },
                  data: { is_favorite: false, updated_at: new Date() },
                });
              }
            }

            // Asegura company_id también aquí
            await tx.whatsapp_template.updateMany({
              where: { id: templateId, company_id: companyId },
              data: { is_favorite: isFavorite, updated_at: new Date() },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
        );

        return NextResponse.json({ ok: true, groupKey, templateId, isFavorite });
      } catch (e) {
        if (attempt < MAX_RETRIES && isRetryableTxError(e)) continue;
        throw e;
      }
    }

    return NextResponse.json({ ok: false, error: "No se pudo completar la operación" }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || "Error favorito" }, { status: 500 });
  }
}