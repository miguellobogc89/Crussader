// app/api/account/overview/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { getBootstrapData } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email ?? null;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, account_id: true },
    });

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    // ===== Bootstrap (para activeCompany) =====
    let bootstrap: Awaited<ReturnType<typeof getBootstrapData>> | null = null;
    try {
      bootstrap = await getBootstrapData();
    } catch {
      bootstrap = null;
    }

    const activeCompanyId = bootstrap?.activeCompany?.id ?? null;

    // ===== Resolver company + account =====
    let company:
      | {
          id: string;
          name: string;
          logoUrl: string | null;
          activity: string | null;
          city: string | null;
          country: string | null;
          reviewsAvg: any;
          reviewsCount: number;
          account_id: string;
        }
      | null = null;

    let account: any = null;

    // 1) Si hay activeCompany desde bootstrap
    if (activeCompanyId) {
      company = await prisma.company.findUnique({
        where: { id: activeCompanyId },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          activity: true,
          city: true,
          country: true,
          reviewsAvg: true,
          reviewsCount: true,
          account_id: true,
        },
      });

      if (company?.account_id) {
        account = await prisma.account.findUnique({
          where: { id: company.account_id },
        });
      }
    }

    // 2) Fallback: desde user.account_id u owner_user_id
    if (!account) {
      if (user.account_id) {
        account = await prisma.account.findUnique({
          where: { id: user.account_id },
        });
      }

      if (!account) {
        account = await prisma.account.findFirst({
          where: { owner_user_id: user.id },
        });
      }

      if (account && !company) {
        company = await prisma.company.findFirst({
          where: { account_id: account.id },
          select: {
            id: true,
            name: true,
            logoUrl: true,
            activity: true,
            city: true,
            country: true,
            reviewsAvg: true,
            reviewsCount: true,
            account_id: true,
          },
        });
      }
    }

    const now = new Date();

    // Si no hay account todavía -> devolver estructura vacía razonable
    if (!account) {
      return NextResponse.json({
        ok: true,
        nowIso: now.toISOString(),
        accountId: null,
        account: null,
        company: company
          ? {
              id: company.id,
              name: company.name,
              logoUrl: company.logoUrl,
              activity: company.activity,
              city: company.city,
              country: company.country,
              locationsCount: 0,
              totalReviews: Number(company.reviewsCount || 0),
              avgRating: company.reviewsAvg
                ? Number(company.reviewsAvg)
                : null,
            }
          : null,
        limits: {},
        products: [],
        billing: null,
        integrations: { totalActive: 0, items: [] },
        metrics: {
          avgRating: company?.reviewsAvg
            ? Number(company.reviewsAvg)
            : null,
          totalReviews: company?.reviewsCount || 0,
          newReviewsThisWeek: 0,
          responseRate: null,
          avgResponseTimeHours: null,
        },
      });
    }

    // ===== Subscription status consolidado =====
    let status = account.subscription_status ?? "NONE";

    const trialStart = account.trial_start_at
      ? new Date(account.trial_start_at)
      : null;
    const trialEnd = account.trial_end_at
      ? new Date(account.trial_end_at)
      : null;
    const planRenews = account.plan_renews_at
      ? new Date(account.plan_renews_at)
      : null;

    if (status === "NONE" || status == null) {
      if (trialStart && trialEnd && now >= trialStart && now <= trialEnd) {
        status = "TRIAL";
      } else if (planRenews && planRenews > now) {
        status = "ACTIVE";
      } else if (account.trial_used) {
        status = "TRIAL_ENDED";
      } else {
        status = "NONE";
      }
    }

    let trial: {
      startAt: string | null;
      endAt: string | null;
      daysLeft: number;
    } | null = null;

    if (status === "TRIAL" && trialEnd) {
      const daysLeft = Math.max(
        0,
        Math.ceil(
          (trialEnd.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      trial = {
        startAt: trialStart ? trialStart.toISOString() : null,
        endAt: trialEnd.toISOString(),
        daysLeft,
      };
    }

    const plan =
      status === "ACTIVE" || account.plan_slug || account.plan_renews_at
        ? {
            slug: account.plan_slug,
            renewsAt: account.plan_renews_at
              ? account.plan_renews_at.toISOString()
              : null,
          }
        : null;

    // ===== Company + métricas básicas =====
    let locationsCount = 0;
    let avgRating: number | null = null;
    let totalReviews = 0;

    if (company) {
      locationsCount = await prisma.location.count({
        where: { companyId: company.id },
      });

      avgRating = company.reviewsAvg
        ? Number(company.reviewsAvg)
        : null;
      totalReviews = company.reviewsCount || 0;
    }

    // ===== Entitlements por account =====
    const entitlements = await prisma.entitlement.findMany({
      where: { account_id: account.id, active: true },
      select: {
        quantity: true,
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            type: true,
          },
        },
      },
    });

    let usersLimit: number | null = null;
    let locationsLimit: number | null = null;

    const products = entitlements.map((e) => {
      const p = e.product;

      if (p?.type === "SEAT") {
        usersLimit = (usersLimit ?? 0) + (e.quantity || 0);
      }

      if (p?.type === "LOCATION") {
        locationsLimit = (locationsLimit ?? 0) + (e.quantity || 0);
      }

      return {
        code: p?.slug ?? p?.id,
        label: p?.name ?? p?.slug ?? p?.id,
        source: "subscription" as const,
        active: true,
      };
    });

    const limits: {
      users?: { used: number; limit: number | null };
      locations?: { used: number; limit: number | null };
    } = {};

    if (usersLimit !== null) {
      limits.users = {
        used: account.current_users ?? 0,
        limit: usersLimit,
      };
    }

    if (locationsLimit !== null) {
      limits.locations = {
        used: locationsCount,
        limit: locationsLimit,
      };
    }

    // ===== Billing (subscription vinculada a company) =====
    let billing:
      | {
          status: string | null;
          currentPeriod:
            | { startAt: string | null; endAt: string | null }
            | null;
          renewsAt: string | null;
          trialEndAt: string | null;
        }
      | null = null;

    if (company) {
      const sub = await prisma.subscription.findFirst({
        where: {
          company_id: company.id,
          status: {
            in: [
              "TRIALING",
              "ACTIVE",
              "INCOMPLETE",
              "PAST_DUE",
              "PAUSED",
            ],
          },
        },
        orderBy: { created_at: "desc" },
      });

      if (sub) {
        billing = {
          status: sub.status,
          currentPeriod: {
            startAt: sub.current_period_start
              ? sub.current_period_start.toISOString()
              : null,
            endAt: sub.current_period_end
              ? sub.current_period_end.toISOString()
              : null,
          },
          renewsAt:
            account.plan_renews_at
              ? account.plan_renews_at.toISOString()
              : sub.current_period_end
              ? sub.current_period_end.toISOString()
              : null,
          trialEndAt: sub.trial_end_at
            ? sub.trial_end_at.toISOString()
            : null,
        };
      }
    }

    // ===== Integraciones =====
    let integrations = {
      totalActive: 0,
      items: [] as Array<{
        provider: string;
        status: "active" | "warning" | "disconnected";
        lastSync: string | null;
      }>,
    };

    if (company) {
      const conns = await prisma.externalConnection.findMany({
        where: { companyId: company.id },
        select: {
          provider: true,
          updatedAt: true,
        },
      });

      const items = conns.map((c) => ({
        provider: c.provider,
        status: "active" as const,
        lastSync: c.updatedAt.toISOString(),
      }));

      integrations = {
        totalActive: items.length,
        items,
      };
    }

    // ===== Métricas =====
    let newReviewsThisWeek = 0;
    let responseRate: number | null = null;
    let avgResponseTimeHours: number | null = null;

    if (company) {
      const weekAgo = new Date(
        now.getTime() - 7 * 24 * 60 * 60 * 1000
      );

      newReviewsThisWeek = await prisma.review.count({
        where: {
          companyId: company.id,
          createdAtG: { gte: weekAgo },
        },
      });

      if (totalReviews > 0) {
        const respondedCount = await prisma.review.count({
          where: {
            companyId: company.id,
            responded: true,
          },
        });

        responseRate = Math.round(
          (respondedCount / totalReviews) * 100
        );
      }

      const agg = await prisma.review.aggregate({
        where: {
          companyId: company.id,
          responseDelaySec: { not: null },
        },
        _avg: { responseDelaySec: true },
      });

      if (agg._avg.responseDelaySec != null) {
        avgResponseTimeHours =
          agg._avg.responseDelaySec / 3600;
      }
    }

    return NextResponse.json({
      ok: true,
      nowIso: now.toISOString(),
      accountId: account.id,
      account: {
        id: account.id,
        name: account.name,
        slug: account.slug,
        status: account.status,
        subscriptionStatus: String(status).toLowerCase(),
        trial,
        plan,
      },
      company: company
        ? {
            id: company.id,
            name: company.name,
            logoUrl: company.logoUrl,
            activity: company.activity,
            city: company.city,
            country: company.country,
            locationsCount,
            totalReviews,
            avgRating,
          }
        : null,
      limits,
      products,
      billing,
      integrations,
      metrics: {
        avgRating,
        totalReviews,
        newReviewsThisWeek,
        responseRate,
        avgResponseTimeHours,
      },
    });
  } catch (err) {
    console.error("[GET /api/account/overview] error:", err);
    return NextResponse.json(
      { ok: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
