// app/reviews/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ReviewWithResponseCard from "../../components/Reviews/ReviewWithResponseCard";

type PageProps = {
  searchParams?: { companyId?: string; page?: string };
};

const PAGE_SIZE = 9; // 3 columnas x 3 filas

export default async function ReviewsPage({ searchParams }: PageProps) {
  // 1) Cargar todas las empresas que tienen reviews (para las pestañas)
  const companies = await prisma.company.findMany({
    where: { Reviews: { some: {} } },
    select: { id: true, name: true, _count: { select: { Reviews: true } } },
    orderBy: { name: "asc" },
  });

  if (companies.length === 0) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-xl font-semibold">Reviews</h1>
        <p className="mt-3 text-neutral-600">No hay empresas con reviews aún.</p>
      </div>
    );
  }

  const activeCompanyId =
    searchParams?.companyId && companies.some(c => c.id === searchParams.companyId)
      ? searchParams.companyId
      : companies[0].id;

  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);

  // 2) Total de reviews de la empresa activa (para paginar sin scroll)
  const total = await prisma.review.count({
    where: { companyId: activeCompanyId },
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const skip = (clampedPage - 1) * PAGE_SIZE;

  // 3) Reviews (3x3) con sus responses
  const reviews = await prisma.review.findMany({
    where: { companyId: activeCompanyId },
    include: {
      responses: {
        orderBy: [{ published: "desc" }, { createdAt: "desc" }],
      },
    },
    orderBy: [{ createdAtG: "desc" }, { ingestedAt: "desc" }],
    skip,
    take: PAGE_SIZE,
  });

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Pestañas por empresa */}
      <div className="flex flex-wrap items-center gap-2 border-b pb-2">
        {companies.map((c) => {
          const active = c.id === activeCompanyId;
          const href = `/reviews?companyId=${c.id}&page=1`;
          return (
            <Link
              key={c.id}
              href={href}
              className={[
                "rounded-md px-3 py-1.5 text-sm",
                active
                  ? "bg-black text-white"
                  : "bg-neutral-100 text-neutral-800 hover:bg-neutral-200",
              ].join(" ")}
              title={`${c.name} (${c._count.Reviews})`}
            >
              {c.name} <span className="opacity-70">({c._count.Reviews})</span>
            </Link>
          );
        })}
      </div>

      {/* Grid 3 columnas: de izq→der y arriba→abajo */}
      <div className="grid grid-cols-3 gap-4">
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
          <div className="col-span-3 text-neutral-600">
            No hay reviews en esta página.
          </div>
        )}
      </div>

      {/* Paginación sin scroll (9 por página) */}
      <div className="flex items-center justify-between border-t pt-3">
        <div className="text-sm text-neutral-600">
          Página {clampedPage} de {totalPages} · {total} reviews
        </div>
        <div className="flex items-center gap-2">
          <PageLink
            label="Anterior"
            disabled={clampedPage <= 1}
            href={
              clampedPage <= 1
                ? undefined
                : `/reviews?companyId=${activeCompanyId}&page=${clampedPage - 1}`
            }
          />
          <PageLink
            label="Siguiente"
            disabled={clampedPage >= totalPages}
            href={
              clampedPage >= totalPages
                ? undefined
                : `/reviews?companyId=${activeCompanyId}&page=${clampedPage + 1}`
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
