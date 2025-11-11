// app/api/companies/active-company/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { getBootstrapData } from "@/lib/bootstrap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIVE_COOKIE = "active_company_id";

// ===== GET: devolver empresa activa con datos resumidos =====
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;
    if (!email) {
      return NextResponse.json(
        { ok: false, error: "unauth" },
        { status: 401 }
      );
    }

    // Usamos bootstrap para respetar la misma lógica centralizada
    const bootstrap = await getBootstrapData();
    const active = bootstrap.activeCompany;

    if (!active) {
      return NextResponse.json({
        ok: true,
        activeCompany: null,
      });
    }

    // Extras calculados: nº ubicaciones, métricas básicas
    const locationsCount = await prisma.location.count({
      where: { companyId: active.id },
    });

    const totalReviews = active.reviewsCount ?? 0;
    const avgRating = active.reviewsAvg
      ? Number(active.reviewsAvg)
      : null;

    return NextResponse.json({
      ok: true,
      activeCompany: {
        id: active.id,
        name: active.name,
        logoUrl: active.logoUrl,
        plan: active.plan,
        city: active.city,
        country: active.country,
        website: active.website,
        brandColor: active.brandColor,
        locationsCount,
        totalReviews,
        avgRating,
        lastSyncAt: active.lastSyncAt,
      },
    });
  } catch (e: any) {
    console.error("[GET /api/active-company] error:", e);
    return NextResponse.json(
      { ok: false, error: "unexpected_error" },
      { status: 500 }
    );
  }
}

// ===== POST: fijar empresa activa (ya lo tenías) =====
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;
    if (!email) {
      return NextResponse.json({ ok: false, error: "unauth" }, { status: 401 });
    }

    const { companyId } = (await req.json()) as { companyId?: string };
    if (!companyId || typeof companyId !== "string") {
      return NextResponse.json({ ok: false, error: "invalid_company_id" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ ok: false, error: "no_user" }, { status: 400 });
    }

    const belongs = await prisma.userCompany.findFirst({
      where: { userId: user.id, companyId },
      select: { companyId: true },
    });
    if (!belongs) {
      return NextResponse.json({ ok: false, error: "forbidden_company" }, { status: 403 });
    }

    const jar = await cookies();
    jar.set(ACTIVE_COOKIE, companyId, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({ ok: true, activeCompanyId: companyId });
  } catch (e: any) {
    console.error("[POST /api/active-company] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unexpected_error" },
      { status: 500 }
    );
  }
}
