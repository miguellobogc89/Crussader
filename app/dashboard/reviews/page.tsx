// app/reviews/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ReviewWithResponseCard from "@/app/components/Reviews/ReviewWithResponseCard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LocationTabs from "@/app/components/Reviews/LocationTabs";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: { locationId?: string; page?: string };
};

// Mantiene 9 por página (independiente del nº de columnas visibles)
const PAGE_SIZE = 9;

type BaseLoc = {
  id: string;
  title: string;
  _count: { Reviews: number };
  company: { name: string | null } | null;
};
type LocationRow = BaseLoc & { reviewsAvg: number };

export default async function ReviewsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const role = (session?.user as any)?.role ?? "user";

  // 1) Ubicaciones visibles (privacidad)
  let baseLocations: BaseLoc[] = [];

  if (role === "system_admin") {
    baseLocations = await prisma.location.findMany({
      where: { Reviews: { some: {} } },
      select: {
        id: true,
        title: true,
        _count: { select: { Reviews: true } },
        company: { select: { name: true } },
      },
      orderBy: { title: "asc" },
    });
  } else if (email) {
    const me = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (me) {
      baseLocations = await prisma.location.findMany({
        where: {
          Reviews: { some: {} },
          company: { UserCompany: { some: { userId: me.id } } },
        },
        select: {
          id: true,
          title: true,
          _count: { select: { Reviews: true } },
          company: { select: { name: true } },
        },
        orderBy: { title: "asc" },
      });
    }
  }

  if (baseLocations.length === 0) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-xl font-semibold">Reseñas</h1>
        <p className="mt-3 text-neutral-600">No hay ubicaciones con reseñas aún.</p>
      </div>
    );
  }

  // 2) Media por ubicación (groupBy)
  const locationIds = baseLocations.map((l) => l.id);
  const avgByLoc = await prisma.review.groupBy({
    by: ["locationId"],
    where: { locationId: { in: locationIds } },
    _avg: { rating: true },
  });
  const avgMap = new Map(avgByLoc.map((a) => [a.locationId, Number(a._avg.rating ?? 0)]));

  const locations: LocationRow[] = baseLocations.map((l) => ({
    ...l,
    reviewsAvg: avgMap.get(l.id) ?? 0,
  }));

  // 3) Pestaña activa + paginación
  const activeLocationId =
    searchParams?.locationId && locations.some((l) => l.id === searchParams.locationId)
      ? searchParams.locationId!
      : locations[0].id;

  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);

  const total = await prisma.review.count({ where: { locationId: activeLocationId } });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const skip = (clampedPage - 1) * PAGE_SIZE;

  // 4) Reviews (paginadas) con responses
  const reviews = await prisma.review.findMany({
    where: { locationId: activeLocationId },
    include: {
      responses: { orderBy: [{ published: "desc" }, { createdAt: "desc" }] },
    },
    orderBy: [{ createdAtG: "desc" }, { ingestedAt: "desc" }],
    skip,
    take: PAGE_SIZE,
  });

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Tabs de ubicaciones */}
      <LocationTabs
        locations={locations.map((l) => ({
          id: l.id,
          title: l.title,
          company: l.company,
          reviewsAvg: l.reviewsAvg,
        }))}
        activeLocationId={activeLocationId}
      />

      {/* Grid responsive: 1 (móvil), 2 (md), 3 (xl) */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {reviews.map((r) => (
          <div key={r.id} className="min-h-[260px]">
            <ReviewWithResponseCard
              review={{
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                reviewerName: r.reviewerName,
                createdAtG: r.createdAtG,
                ingestedAt: r.ingestedAt,
              }}
              responses={r.responses.map((x) => ({
                id: x.id,
                content: x.content,
                status: x.status,
                published: x.published,
                createdAt: x.createdAt,
                edited: x.edited,
              }))}
            />
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="col-span-1 md:col-span-2 xl:col-span-3 text-neutral-600">
            No hay reseñas en esta página.
          </div>
        )}
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between border-t pt-3">
        <div className="text-sm text-neutral-600">
          Página {clampedPage} de {totalPages} · {total} reseñas
        </div>
        <div className="flex items-center gap-2">
          <PageLink
            label="Anterior"
            disabled={clampedPage <= 1}
            href={
              clampedPage <= 1
                ? undefined
                : `/reviews?locationId=${activeLocationId}&page=${clampedPage - 1}`
            }
          />
          <PageLink
            label="Siguiente"
            disabled={clampedPage >= totalPages}
            href={
              clampedPage >= totalPages
                ? undefined
                : `/reviews?locationId=${activeLocationId}&page=${clampedPage + 1}`
            }
          />
        </div>
      </div>
    </div>
  );
}

function PageLink({
  href,
  label,
  disabled,
}: {
  href?: string;
  label: string;
  disabled?: boolean;
}) {
  if (disabled || !href) {
    return (
      <span className="rounded-md border px-3 py-1.5 text-sm text-neutral-400">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="rounded-md border px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
    >
      {label}
    </Link>
  );
}
