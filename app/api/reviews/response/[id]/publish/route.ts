// app/api/reviews/response/[id]/publish/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getExternalConnectionForCompany,
  getValidAccessToken,
} from "@/lib/integrations/google-business/client";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing id" },
      { status: 400 }
    );
  }

  try {
    // 1) Cargamos la Response + su Review asociada
    const responseRecord = await prisma.response.findUnique({
      where: { id },
      include: {
        review: true,
      },
    });

    if (!responseRecord || !responseRecord.review) {
      return NextResponse.json(
        { ok: false, error: "Response not found" },
        { status: 404 }
      );
    }

    const review = responseRecord.review;

    // 2) Buscamos el espejo GBP de esa review
    const gbpReview = await prisma.google_gbp_reviews.findFirst({
      where: {
        company_id: review.companyId,
        google_review_id: review.externalId,
      },
    });

    if (!gbpReview || !gbpReview.resource_name) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "No GBP mirror found for this review (google_gbp_reviews).",
        },
        { status: 400 }
      );
    }

    // 3) Obtenemos access_token válido para la company
    const extConn = await getExternalConnectionForCompany(review.companyId);
    const accessToken = await getValidAccessToken(extConn);

    // 4) Llamada a la API de Google My Business para publicar/actualizar la reply
    const resourceName = gbpReview.resource_name; // "accounts/.../locations/.../reviews/..."
    const url = `https://mybusiness.googleapis.com/v4/${resourceName}/reply`;

    const googleResp = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        comment: responseRecord.content,
      }),
    });

    if (!googleResp.ok) {
      const text = await googleResp.text().catch(() => "");
      console.error(
        "[GBP] reply failed",
        googleResp.status,
        text.slice(0, 300)
      );
      return NextResponse.json(
        {
          ok: false,
          error: `[GBP] reply_failed_${googleResp.status}`,
          detail: text.slice(0, 300),
        },
        { status: 502 }
      );
    }

    const googleJson = await googleResp.json().catch(() => null as any);

    // Google puede devolver la reply en distintos sitios; nos quedamos con lo que haya
    const replyObj =
      googleJson?.reviewReply ??
      googleJson?.review?.reviewReply ??
      null;

    const replyComment = replyObj?.comment ?? responseRecord.content;
    const replyUpdateTime = replyObj?.updateTime
      ? new Date(replyObj.updateTime)
      : new Date();

    const now = new Date();

    // 5) Actualizamos nuestras tablas internas + espejo GBP
    const [updatedResponse] = await prisma.$transaction([
      // a) Marcar la Response como publicada
      prisma.response.update({
        where: { id: responseRecord.id },
        data: {
          status: "PUBLISHED",
          published: true,
          publishedAt: now,
        },
      }),

      // b) Actualizar la Review interna (marcada como respondida)
      prisma.review.update({
        where: { id: review.id },
        data: {
          responded: true,
          respondedAt: now,
          replyComment,
          replyUpdatedAtG: replyUpdateTime,
        },
      }),

      // c) Actualizar el espejo google_gbp_reviews
      prisma.google_gbp_reviews.update({
        where: { id: gbpReview.id },
        data: {
          reply_comment: replyComment,
          reply_update_time: replyUpdateTime,
        },
      }),

      // d) Upsert en google_gbp_responses (opcional pero consistente)
      prisma.google_gbp_responses.upsert({
        where: {
          company_id_google_review_id: {
            company_id: gbpReview.company_id,
            google_review_id: gbpReview.google_review_id,
          },
        },
        update: {
          comment: replyComment,
          update_time: replyUpdateTime,
        },
        create: {
          company_id: gbpReview.company_id,
          google_review_id: gbpReview.google_review_id,
          comment: replyComment,
          update_time: replyUpdateTime,
        },
      }),
    ]);

    return NextResponse.json(
      { ok: true, response: updatedResponse },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[GBP] publish endpoint error", e);
    const msg = e?.message || "Publish failed";
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  }
}
