// app/api/whatsapp/templates/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/whatsapp/templates/import
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });

    const companyId = typeof body.companyId === "string" ? body.companyId : "";
    const templates = Array.isArray(body.templates) ? body.templates : [];

    if (!companyId) {
      return NextResponse.json({ ok: false, error: "companyId requerido" }, { status: 400 });
    }
    if (templates.length === 0) {
      return NextResponse.json({ ok: false, error: "templates vacío" }, { status: 400 });
    }

    let updated = 0;
    let created = 0;
    let skipped = 0;

    await prisma.$transaction(async (tx) => {
      for (const t of templates) {
        const templateName = typeof t?.template_name === "string" ? t.template_name.trim() : "";
        const title = typeof t?.title === "string" ? t.title.trim() : "";

        if (!templateName || !title) {
          skipped += 1;
          continue;
        }

        const status =
          t?.status === "approved" || t?.status === "pending" || t?.status === "rejected"
            ? t.status
            : "pending";

        const category =
          t?.category === "marketing" || t?.category === "utility" || t?.category === "authentication"
            ? t.category
            : "marketing";

        const language = typeof t?.language === "string" && t.language.trim() ? t.language.trim() : "es";

        const useType =
          t?.use_type === "start_conversation" || t?.use_type === "within_24h"
            ? t.use_type
            : "start_conversation";

        const bodyPreview = typeof t?.body_preview === "string" ? t.body_preview : null;

        const existing = await tx.whatsapp_template.findFirst({
          where: {
            company_id: companyId,
            template_name: templateName,
          },
          select: { id: true },
        });

        if (existing) {
          await tx.whatsapp_template.update({
            where: { id: existing.id },
            data: {
              title,
              status,
              category,
              language,
              use_type: useType,
              body_preview: bodyPreview,
              updated_at: new Date(),
            },
          });
          updated += 1;
        } else {
          await tx.whatsapp_template.create({
            data: {
              company_id: companyId,
              template_name: templateName,
              title,
              status,
              category,
              language,
              use_type: useType,
              body_preview: bodyPreview,
            },
          });
          created += 1;
        }
      }
    });

    return NextResponse.json({ ok: true, created, updated, skipped });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Error importando plantillas" },
      { status: 500 }
    );
  }
}