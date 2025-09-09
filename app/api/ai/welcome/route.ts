// app/api/ai/welcome/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

// Helpers de tiempo
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export async function GET() {
  try {
    // 1) Seguridad: usuario logueado
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;
    if (!email) {
      return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
    }

    // 2) Usuario + empresa activa (escogemos la primera por ahora)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, locale: true, timezone: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "no_user" }, { status: 400 });
    }

    const memberships = await prisma.userCompany.findMany({
      where: { userId: user.id },
      select: { companyId: true },
      orderBy: { createdAt: "asc" },
      take: 1,
    });

    const activeCompanyId = memberships[0]?.companyId ?? null;
    if (!activeCompanyId) {
      return NextResponse.json({
        ok: true,
        data: {
          greeting: `¡Hola${user.name ? `, ${user.name}` : ""}!`,
          recap: "Aún no tienes una empresa activa. Crea una para empezar a recopilar reseñas e insights.",
        },
      });
    }

    const company = await prisma.company.findUnique({
      where: { id: activeCompanyId },
      select: {
        id: true,
        name: true,
        city: true,
        country: true,
        reviewsAvg: true,
        reviewsCount: true,
        lastSyncAt: true,
      },
    });

    // 3) Métricas rápidas de las reviews
    const now = new Date();
    const since7d = daysAgo(7);
    const since30d = daysAgo(30);
    const prev30Start = daysAgo(60);
    const prev30End = since30d;

    // Nuevas en 7 días
    const newReviews7d = await prisma.review.count({
      where: {
        companyId: activeCompanyId,
        createdAtG: { gte: since7d, lte: now },
      },
    });

    // Total reviews (por si lo necesitas fresco)
    const totalReviews = await prisma.review.count({
      where: { companyId: activeCompanyId },
    });

    // Sin respuesta publicada (unanswered): reviews que NO tienen una response PUBLISHED activa
    const unansweredReviews = await prisma.review.count({
      where: {
        companyId: activeCompanyId,
        responses: {
          none: { status: "PUBLISHED", active: true },
        },
      },
    });

    // Media rating últimos 30 días
    const recentReviews = await prisma.review.findMany({
      where: {
        companyId: activeCompanyId,
        createdAtG: { gte: since30d, lte: now },
      },
      select: { rating: true },
    });
    const recentAvg =
      recentReviews.length > 0
        ? (recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length).toFixed(2)
        : null;

    // Media rating 30 días anteriores (para delta)
    const prevReviews = await prisma.review.findMany({
      where: {
        companyId: activeCompanyId,
        createdAtG: { gte: prev30Start, lt: prev30End },
      },
      select: { rating: true },
    });
    const prevAvg =
      prevReviews.length > 0
        ? (prevReviews.reduce((sum, r) => sum + r.rating, 0) / prevReviews.length).toFixed(2)
        : null;

    const unansweredRate = totalReviews > 0 ? Math.round((unansweredReviews / totalReviews) * 100) : 0;

    // 4) Construimos prompt para OpenAI (respuesta en JSON)
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const model = "gpt-4o-mini"; // rápido y barato para UI

    const locale = user.locale ?? "es-ES";
    const tz = user.timezone ?? "Europe/Madrid";

    const sys =
      "Eres un asistente conciso y amable para un panel de reseñas de negocio. " +
      "Devuelve SIEMPRE un objeto JSON con dos claves: greeting (texto corto, 1-2 frases, tono cercano, aleatorio/no repetitivo) " +
      "y recap (texto de 2-4 frases con insights del estado del negocio y sugerencias de acción). " +
      "NO incluyas nada fuera del JSON.";

    const businessContext = {
      userName: user.name ?? null,
      locale,
      timezone: tz,
      companyName: company?.name ?? null,
      companyCity: company?.city ?? null,
      companyCountry: company?.country ?? null,
      companyReviewsAvg: company?.reviewsAvg ? company.reviewsAvg.toString() : null,
      companyReviewsCount: company?.reviewsCount ?? 0,
      lastSyncAt: company?.lastSyncAt ?? null,
      kpis: {
        newReviews7d,
        totalReviews,
        unansweredReviews,
        unansweredRate,
        recentAvg,
        prevAvg,
      },
      todayISO: now.toISOString(),
    };

    const completion = await openai.chat.completions.create({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        {
          role: "user",
          content: [
            "Genera el JSON con greeting y recap en español.",
            "Detalles de contexto del negocio:",
            JSON.stringify(businessContext),
            "Criterios:",
            "- El greeting debe variar (saludos distintos cada sesión), 1-2 frases, cercano, sin emojis.",
            "- El recap menciona nuevas reseñas de la última semana, si hay pendientes de respuesta, y aconseja contestar.",
            "- Si hay delta de media (recentAvg vs prevAvg), coméntalo brevemente.",
            "- Sé útil, positivo y accionable sin sonar vendedor.",
          ].join("\n"),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { greeting?: string; recap?: string } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      // fallback súper defensivo
      parsed = {
        greeting: `¡Hola${user.name ? `, ${user.name}` : ""}!`,
        recap:
          "Aquí verás un resumen de tus reseñas e insights del negocio. En cuanto sincronices, podrás revisar las nuevas y responderlas desde este panel.",
      };
    }

    return NextResponse.json({ ok: true, data: parsed });
  } catch (err: any) {
    const status = err?.status ?? 500;
    const message = err?.message ?? "welcome_failed";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
