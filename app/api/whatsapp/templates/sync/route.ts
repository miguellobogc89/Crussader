// app/api/whatsapp/templates/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  PrismaClient,
  whatsapp_template_category,
  whatsapp_template_status,
} from "@prisma/client";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

function mapTemplateStatus(value: string): whatsapp_template_status {
  const v = String(value || "").toLowerCase();

  if (v === "approved") return whatsapp_template_status.approved;
  if (v === "rejected") return whatsapp_template_status.rejected;

  return whatsapp_template_status.pending;
}

function mapTemplateCategory(value: string): whatsapp_template_category {
  const v = String(value || "").toLowerCase();

  if (v === "utility") return whatsapp_template_category.utility;
  if (v === "authentication") return whatsapp_template_category.authentication;

  return whatsapp_template_category.marketing;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { ok: false, error: "companyId_required" },
        { status: 400 }
      );
    }

    const token = process.env.WHATSAPP_PERMANENT_TOKEN;

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "missing_whatsapp_token" },
        { status: 500 }
      );
    }

    const phone = await prisma.company_phone_number.findFirst({
      where: { company_id: companyId },
      select: { waba_id: true },
    });

    if (!phone?.waba_id) {
      return NextResponse.json(
        { ok: false, error: "waba_not_found" },
        { status: 404 }
      );
    }

    const url = `https://graph.facebook.com/v21.0/${phone.waba_id}/message_templates`;

    const metaRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!metaRes.ok) {
      const text = await metaRes.text();
      console.error("[WA templates sync] meta error", text);

      return NextResponse.json(
        { ok: false, error: "meta_fetch_failed" },
        { status: 500 }
      );
    }

    const json = await metaRes.json();
    const templates = Array.isArray(json.data) ? json.data : [];

    for (const t of templates) {
      const bodyComponent = Array.isArray(t.components)
        ? t.components.find((c: any) => c.type === "BODY")
        : null;

      const bodyPreview =
        bodyComponent && typeof bodyComponent.text === "string"
          ? bodyComponent.text
          : "";

      await prisma.whatsapp_template.upsert({
        where: {
          company_id_template_name: {
            company_id: companyId,
            template_name: t.name,
          },
        },
        update: {
          title: t.name,
          status: mapTemplateStatus(t.status),
          category: mapTemplateCategory(t.category),
          language: t.language ?? "es",
          body_preview: bodyPreview,
          updated_at: new Date(),
        },
        create: {
          company_id: companyId,
          template_name: t.name,
          title: t.name,
          status: mapTemplateStatus(t.status),
          category: mapTemplateCategory(t.category),
          language: t.language ?? "es",
          body_preview: bodyPreview,
          updated_at: new Date(),
        },
      });
    }

    return NextResponse.json({
      ok: true,
      synced: templates.length,
    });
  } catch (err) {
    console.error("[WA templates sync]", err);

    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}