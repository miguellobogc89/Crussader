// app/api/reviews/response/auto-publish/cron/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/server/db";
import { ReviewProvider } from "@prisma/client";
import {
  getExternalConnectionForCompany,
  getValidAccessToken,
} from "@/lib/integrations/google-business/client";

export const runtime = "nodejs";

type AutoPublishMode = "manual" | "positives" | "mixed";

type AutoPublishConfig = {
  mode: AutoPublishMode;
  whatsappNotifyEnabled: boolean;
};

function resolveAutoPublishConfig(rawConfig: any): AutoPublishConfig {
  const cfg = (rawConfig ?? {}) as any;
  const ap = cfg.autoPublish ?? {};

  let mode: AutoPublishMode = "manual";
  if (ap.mode === "positives" || ap.mode === "mixed" || ap.mode === "manual") {
    mode = ap.mode;
  }

  const whatsappNotifyEnabled = Boolean(ap.whatsappNotifyEnabled);

  return { mode, whatsappNotifyEnabled };
}

// Decide si una review es publicable según modo + rating
function shouldAutoPublishRating(mode: AutoPublishMode, rating: number | null): boolean {
  if (!rating || rating < 1 || rating > 5) return false;

  if (mode === "manual") return false;

  if (mode === "positives") {
    // Solo 4★ y 5★
    return rating >= 4;
  }

  if (mode === "mixed") {
    // 3–5★, 1–2★ siempre se revisan
    return rating >= 3;
  }

  return false;
}

// ⏳ Mínimo 10 min desde la creación de la Response (para no disparar al segundo)
const MIN_DELAY_MS = 10 * 60 * 1000; // 10 minutos

// 🕒 Máximo 24h desde la creación de la REVIEW para autopublicar
const MAX_REVIEW_AGE_MS = 24 * 60 * 60 * 1000; // 24 horas


export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const companyIdFilter = (body?.companyId as string | undefined)?.trim() || undefined;
    const maxPerRun =
      typeof body?.maxPerRun === "number" && body.maxPerRun > 0 && body.maxPerRun <= 200
        ? body.maxPerRun
        : 50;

    const now = new Date();
    const currentHour = now.getHours();

    // Ventana horaria 08:00–24:00
    if (currentHour < 8 || currentHour >= 24) {
      return NextResponse.json({
        ok: true,
        skippedReason: "outside_allowed_hours_8_24",
      });
    }

    // 1) Responses pendientes de autopublicación
    const pending = await prisma.response.findMany({
      where: {
        auto_publish_status: "pending",
        published: false,
        source: "AI",
        review: {
          provider: ReviewProvider.GOOGLE,
          ...(companyIdFilter ? { companyId: companyIdFilter } : {}),
        },
      },
      include: {
        review: {
          select: {
            id: true,
            companyId: true,
            rating: true,
            externalId: true,
            locationId: true,
            createdAtG: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: maxPerRun,
    });

    if (pending.length === 0) {
      return NextResponse.json({
        ok: true,
        processed: 0,
        autoPublished: 0,
        skipped: 0,
        errors: 0,
        detail: [],
      });
    }

    // Agrupar por companyId para reutilizar settings + token
    const byCompany = new Map<string, typeof pending>();

    for (const resp of pending) {
      const companyId = resp.review.companyId;
      if (!companyId) continue;
      if (!byCompany.has(companyId)) {
        byCompany.set(companyId, []);
      }
      byCompany.get(companyId)!.push(resp);
    }

    const summary: Array<{
      companyId: string;
      mode: AutoPublishMode;
      candidates: number;
      autoPublished: number;
      skipped: number;
      errors: number;
    }> = [];

    for (const [companyId, responses] of byCompany.entries()) {
      // 2) Cargar settings de la compañía
      const rs = await prisma.responseSettings.findUnique({
        where: { companyId },
        select: { config: true },
      });

      const { mode } = resolveAutoPublishConfig(rs?.config ?? {});

      let autoPublished = 0;
      let skipped = 0;
      let errors = 0;

      // Si el modo es manual, no tocamos nada de esta compañía
      if (mode === "manual") {
        summary.push({
          companyId,
          mode,
          candidates: responses.length,
          autoPublished,
          skipped,
          errors,
        });
        continue;
      }

      // 3) ExternalConnection + access token para GBP
      let accessToken: string | null = null;
      try {
        const ext = await getExternalConnectionForCompany(companyId);
        accessToken = await getValidAccessToken(ext);
      } catch (e) {
        // Si falla el token, esta compañía entera no se puede procesar
        errors += responses.length;
        summary.push({
          companyId,
          mode,
          candidates: responses.length,
          autoPublished,
          skipped,
          errors,
        });
        continue;
      }

      if (!accessToken) {
        errors += responses.length;
        summary.push({
          companyId,
          mode,
          candidates: responses.length,
          autoPublished,
          skipped,
          errors,
        });
        continue;
      }

      // 4) Mapear externalId -> resource_name en google_gbp_reviews
      const externalIds = Array.from(
        new Set(
          responses
            .map((r) => r.review.externalId)
            .filter((id): id is string => !!id),
        ),
      );

      const gbpRows = await prisma.google_gbp_reviews.findMany({
        where: {
          company_id: companyId,
          google_review_id: { in: externalIds },
        },
        select: {
          google_review_id: true,
          resource_name: true,
        },
      });

      const resourceByExternalId = new Map<string, string>();
      for (const row of gbpRows) {
        if (row.google_review_id && row.resource_name) {
          resourceByExternalId.set(row.google_review_id, row.resource_name);
        }
      }

      // 5) Procesar responses de esta compañía
      for (const resp of responses) {
        const rating = resp.review.rating;
        const externalId = resp.review.externalId;
        const reviewCreatedAtG = resp.review.createdAtG;

        // 1) Delay mínimo desde creación de la RESPONSE
        const responseCreatedAt =
          resp.createdAt ?? new Date(now.getTime() - MIN_DELAY_MS);
        const responseAgeMs = now.getTime() - responseCreatedAt.getTime();

        // ⏳ Aún no han pasado los 10 min mínimos: lo dejamos pending (seguirá en pending para el próximo cron)
        if (responseAgeMs < MIN_DELAY_MS) {
          continue;
        }

        // 2) Límite de edad de la REVIEW: solo autopublicar si la review tiene < 24h (según createdAtG de Google)
        if (!reviewCreatedAtG) {
          // Sin fecha fiable de publicación en Google → por seguridad nunca autopublicamos
          await prisma.response.update({
            where: { id: resp.id },
            data: {
              auto_publish_status: "skipped",
            },
          });
          skipped += 1;
          continue;
        }

        const reviewAgeMs = now.getTime() - reviewCreatedAtG.getTime();

        // Si la review tiene más de 24h, no se autopublica nunca
        if (reviewAgeMs > MAX_REVIEW_AGE_MS) {
          await prisma.response.update({
            where: { id: resp.id },
            data: {
              auto_publish_status: "skipped",
            },
          });
          skipped += 1;
          continue;
        }

        // 3) Rating según modo
        if (!shouldAutoPublishRating(mode, rating)) {
          await prisma.response.update({
            where: { id: resp.id },
            data: {
              auto_publish_status: "skipped",
            },
          });
          skipped += 1;
          continue;
        }

        if (!externalId) {
          // No sabemos contra qué review de Google publicar
          await prisma.response.update({
            where: { id: resp.id },
            data: {
              auto_publish_status: "skipped",
            },
          });
          skipped += 1;
          continue;
        }

        const resourceName = resourceByExternalId.get(externalId);
        if (!resourceName) {
          // No tenemos resource_name asociado
          await prisma.response.update({
            where: { id: resp.id },
            data: {
              auto_publish_status: "skipped",
            },
          });
          skipped += 1;
          continue;
        }

        // 6) Llamada a Business Profile API para publicar la respuesta
        const url = `https://mybusiness.googleapis.com/v4/${resourceName}/reply`;

        try {
          const res = await fetch(url, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              comment: resp.content ?? "",
            }),
          });

          if (!res.ok) {
            console.error("[autopublish][google_reply_error]", {
              companyId,
              responseId: resp.id,
              status: res.status,
            });
            errors += 1;
            // Lo dejamos en pending para reintentar en el próximo cron
            continue;
          }

          // 7) Marcar response como publicada
          await prisma.response.update({
            where: { id: resp.id },
            data: {
              published: true,
              publishedAt: new Date(),
              auto_publish_status: "done",
            },
          });

          autoPublished += 1;
        } catch (err: any) {
          console.error("[autopublish][network_error]", {
            companyId,
            responseId: resp.id,
            error: err?.message ?? String(err),
          });
          errors += 1;
          // Lo dejamos pending para reintento
        }
      }


      summary.push({
        companyId,
        mode,
        candidates: responses.length,
        autoPublished,
        skipped,
        errors,
      });
    }

    const totals = summary.reduce(
      (acc, s) => {
        acc.candidates += s.candidates;
        acc.autoPublished += s.autoPublished;
        acc.skipped += s.skipped;
        acc.errors += s.errors;
        return acc;
      },
      { candidates: 0, autoPublished: 0, skipped: 0, errors: 0 },
    );

    return NextResponse.json({
      ok: true,
      ...totals,
      perCompany: summary,
    });
  } catch (err: any) {
    console.error("[reviews][cron][autopublish] error", err);
    return NextResponse.json(
      {
        ok: false,
        error: "internal_error",
        details: err?.message ?? String(err),
      },
      { status: 500 },
    );
  }
}

// 👇 Añadido para que el cron de Vercel (GET) reutilice la misma lógica
export async function GET(req: NextRequest) {
  return POST(req);
}
