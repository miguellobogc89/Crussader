// app/api/reviews/response/[id]/unpublish/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getExternalConnectionForCompany,
  getValidAccessToken,
} from "@/lib/integrations/google-business/client";

export const runtime = "nodejs";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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
      include: { review: true },
    });

    if (!responseRecord || !responseRecord.review) {
      return NextResponse.json(
        { ok: false, error: "Response not found" },
        { status: 404 }
      );
    }

    const review = responseRecord.review;

    // 2) Buscamos la review espejo en GBP
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

    // 3) Obtenemos access token válido
    const extConn = await getExternalConnectionForCompany(review.companyId);
    const accessToken = await getValidAccessToken(extConn);

    // 4) Llamada a Google para eliminar la respuesta
    const resourceName = gbpReview.resource_name;
    const url = `https://mybusiness.googleapis.com/v4/${resourceName}/reply`;

    const googleResp = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!googleResp.ok) {
      const text = await googleResp.text().catch(() => "");
      console.error(
        "[GBP] deleteReply failed",
        googleResp.status,
        text.slice(0, 300)
      );

      return NextResponse.json(
        {
          ok: false,
          error: `[GBP] delete_failed_${googleResp.status}`,
          detail: text.slice(0, 300),
        },
        { status: 502 }
      );
    }

    // 5) Actualizamos nuestras tablas para reflejar la eliminación
    const now = new Date();

    const [updatedResponse] = await prisma.$transaction([
      // a) Despublicar la Response
      prisma.response.update({
        where: { id: responseRecord.id },
        data: {
          published: false,
          publishedAt: null,
          status: "PENDING",
        },
      }),

      // b) Actualizar la Review interna
      prisma.review.update({
        where: { id: review.id },
        data: {
          responded: false,
          respondedAt: null,
          replyComment: null,
          replyUpdatedAtG: null,
        },
      }),

      // c) Limpiar el espejo principal GBP
      prisma.google_gbp_reviews.update({
        where: { id: gbpReview.id },
        data: {
          reply_comment: null,
          reply_update_time: null,
        },
      }),

      // d) Limpiar la tabla google_gbp_responses
      prisma.google_gbp_responses.deleteMany({
        where: {
          company_id: gbpReview.company_id,
          google_review_id: gbpReview.google_review_id,
        },
      }),
    ]);

    return NextResponse.json(
      { ok: true, response: updatedResponse },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[GBP] unpublish endpoint error", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Unpublish failed" },
      { status: 500 }
    );
  }
}
