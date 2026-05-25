// app/api/whatsapp/templates/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  whatsapp_template_category,
  whatsapp_template_scope,
  whatsapp_template_status,
  whatsapp_template_use_type,
} from "@prisma/client";

export const dynamic = "force-dynamic";

function mapMetaCategory(
  category: whatsapp_template_category
): "MARKETING" | "UTILITY" | "AUTHENTICATION" {
  if (category === whatsapp_template_category.utility) {
    return "UTILITY";
  }

  if (category === whatsapp_template_category.authentication) {
    return "AUTHENTICATION";
  }

  return "MARKETING";
}

function normalizeCategory(value: unknown): whatsapp_template_category {
  if (value === "utility") {
    return whatsapp_template_category.utility;
  }

  if (value === "authentication") {
    return whatsapp_template_category.authentication;
  }

  return whatsapp_template_category.marketing;
}

function convertFriendlyVarsToMeta(body: string) {
  const examplesByFriendlyVar: Record<string, string> = {
    nombre_cliente: "María",
    fecha_cita: "19/03",
    hora_cita: "17:30",
    nombre_negocio: "Clínica Moderna",
  };

  const usedVars: string[] = [];

  const metaText = String(body || "").replace(
    /\{\{(nombre_cliente|fecha_cita|hora_cita|nombre_negocio)\}\}/g,
    (_match, varName: string) => {
      let index = usedVars.indexOf(varName);

      if (index === -1) {
        usedVars.push(varName);
        index = usedVars.length - 1;
      }

      return `{{${index + 1}}}`;
    }
  );

  const exampleValues = usedVars.map((varName) => {
    return examplesByFriendlyVar[varName] ?? "Ejemplo";
  });

  return {
    metaText,
    exampleValues,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Body inválido" },
        { status: 400 }
      );
    }

    const companyId =
      typeof body.companyId === "string" ? body.companyId.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const templateName =
      typeof body.template_name === "string" ? body.template_name.trim() : "";
    const bodyPreview =
      typeof body.body_preview === "string" ? body.body_preview.trim() : "";
    const language =
      typeof body.language === "string" && body.language.trim()
        ? body.language.trim()
        : "es";

    const category = normalizeCategory(body.category);

    if (!companyId || !templateName || !title) {
      return NextResponse.json(
        { ok: false, error: "companyId, template_name y title requeridos" },
        { status: 400 }
      );
    }

    if (!bodyPreview) {
      return NextResponse.json(
        { ok: false, error: "body_preview requerido" },
        { status: 400 }
      );
    }

    const exists = await prisma.whatsapp_template.findFirst({
      where: {
        OR: [
          {
            company_id: companyId,
            template_name: templateName,
          },
          {
            scope: "public",
            template_name: templateName,
          },
        ],
      },
      select: { id: true },
    });

    if (exists) {
      return NextResponse.json(
        { ok: false, error: "Ya existe una plantilla con ese nombre" },
        { status: 409 }
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
      where: {
        company_id: companyId,
      },
      select: {
        waba_id: true,
      },
    });

    if (!phone?.waba_id) {
      return NextResponse.json(
        { ok: false, error: "waba_not_found" },
        { status: 404 }
      );
    }

    const { metaText, exampleValues } = convertFriendlyVarsToMeta(bodyPreview);

    const metaPayload = {
      name: templateName,
      language,
      category: mapMetaCategory(category),
components: [
  {
    type: "BODY",
    text: metaText,
    example: {
      body_text: [exampleValues],
    },
  },
],
    };

    console.log("CREATE_TEMPLATE_BODY", JSON.stringify(body, null, 2));

    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${phone.waba_id}/message_templates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metaPayload),
        cache: "no-store",
      }
    );

    const metaJson = await metaRes.json().catch(() => null);

    if (!metaRes.ok) {
      const metaMessage =
        metaJson &&
        typeof metaJson === "object" &&
        "error" in metaJson &&
        metaJson.error &&
        typeof metaJson.error.message === "string"
          ? metaJson.error.message
          : "meta_publish_failed";

      return NextResponse.json(
        {
          ok: false,
          error: metaMessage,
          meta: metaJson,
        },
        { status: 500 }
      );
    }

    const created = await prisma.whatsapp_template.create({
      data: {
        company_id: companyId,
        template_name: templateName,
        title,
        category,
        language,
        use_type: whatsapp_template_use_type.start_conversation,
        scope: whatsapp_template_scope.private,
        body_preview: bodyPreview,
        status: whatsapp_template_status.pending,
      },
    });

    return NextResponse.json({
      ok: true,
      item: created,
      meta: metaJson,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message || "Error creando plantilla" },
      { status: 500 }
    );
  }
}