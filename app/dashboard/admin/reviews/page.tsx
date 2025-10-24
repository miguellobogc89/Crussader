// app/dashboard/admin/reviews/page.tsx
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

const FIXED_LOCATION_ID = "cmfmxr01c000di5i4kh7tal6o";

/** ---------------- Utils ---------------- */
async function internalBaseUrl() {
  const h = await headers();
  const host = h.get("host")!;
  const isProd = !!process.env.VERCEL || host?.startsWith("localhost") === false;
  const protocol = isProd ? "https" : "http";
  return `${protocol}://${host}`;
}

/** ---------------- Server Actions ---------------- */
async function refresh() {
  "use server";
  revalidatePath("/dashboard/admin/reviews");
}

async function generateForId(formData: FormData) {
  "use server";
  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  const base = await internalBaseUrl();
  await fetch(`${base}/api/reviews/${id}/responses`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "generate" }),
    cache: "no-store",
  }).catch(() => {});

  revalidatePath("/dashboard/admin/reviews");
}

/** Crea una review de prueba atada a la location fija */
async function createTriggerReview() {
  "use server";

  // 1) Obtenemos la companyId a partir de la location fija
  const loc = await prisma.location.findUnique({
    where: { id: FIXED_LOCATION_ID },
    select: { id: true, companyId: true },
  });

  if (!loc) {
    // Si no existe esa location, no hacemos nada (evitamos creaciones que te daban error)
    // Si prefieres, podríamos lanzar un error y mostrar un mensaje en UI.
    return;
  }

  // 2) Comentario aleatorio
  const randomComments = [
    "Todo fue genial, volvería sin dudarlo.",
    "La atención fue rápida y amable.",
    "Servicio correcto, aunque podría mejorar.",
    "Experiencia regular, esperaba algo más.",
    "Excelente trato, muy recomendado.",
  ];
  const randomComment =
    randomComments[Math.floor(Math.random() * randomComments.length)];

  // 3) Crear review respetando tu schema:
  //    - createdAtG (fecha de publicación)
  //    - comment
  //    - reviewerName: "trigger_test"
  //    - provider, externalId, rating
  //    - companyId, locationId (de la location fija)
  await prisma.review.create({
    data: {
      provider: "GOOGLE",
      externalId: `trg_${Date.now()}`,
      rating: Math.floor(Math.random() * 5) + 1,
      reviewerName: "trigger_test",
      comment: randomComment,
      createdAtG: new Date(),
      companyId: loc.companyId,
      locationId: loc.id,
    },
  });

  revalidatePath("/dashboard/admin/reviews");
}

/** ---------------- Data ---------------- */
async function getLatestReviews() {
  // Últimas 10 por createdAtG (tu “fecha de publicación”)
  const reviews = await prisma.review.findMany({
    orderBy: { createdAtG: "desc" },
    take: 10,
    select: {
      id: true,
      reviewerName: true,
      comment: true,
      createdAtG: true,
      _count: { select: { responses: true } },
    },
  });

  return reviews.map((r) => ({
    id: r.id,
    name: r.reviewerName ?? "—",
    comment: r.comment ?? "—",
    publishedAt: r.createdAtG,
    responded: r._count?.responses > 0,
  }));
}

export const dynamic = "force-dynamic";

/** ---------------- Page ---------------- */
export default async function AdminReviewsPage() {
  const rows = await getLatestReviews();

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Admin · Reseñas</h1>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Últimas 10 por fecha (createdAtG)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Actualizar (revalidate) */}
          <form action={refresh}>
            <button
              type="submit"
              className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted"
              title="Actualizar la tabla"
            >
              Actualizar
            </button>
          </form>

          {/* Crear review trigger_test en la location fija */}
          <form action={createTriggerReview}>
            <button
              type="submit"
              className="h-9 rounded-md bg-emerald-600 px-3 text-sm font-medium text-white hover:bg-emerald-700"
              title={`Crear review en location ${FIXED_LOCATION_ID}`}
            >
              Crear review trigger_test
            </button>
          </form>
        </div>
      </header>

      {/* Generar respuesta IA por ID manual */}
      <form action={generateForId} className="flex items-center gap-2">
        <input
          name="id"
          type="text"
          placeholder="ID de review…"
          className="h-9 w-64 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Generar respuesta IA
        </button>
      </form>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            <col className="w-[210px]" />
            <col className="w-[180px]" />
            <col />
            <col className="w-[140px]" />
            <col className="w-[180px]" />
          </colgroup>
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">ID</th>
              <th className="px-3 py-2 text-left font-medium">Nombre</th>
              <th className="px-3 py-2 text-left font-medium">Comentario</th>
              <th className="px-3 py-2 text-left font-medium">Respondida</th>
              <th className="px-3 py-2 text-left font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                  No hay reseñas todavía.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td
                    className="truncate px-3 py-2 font-mono text-xs text-muted-foreground"
                    title={r.id}
                  >
                    {r.id}
                  </td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">
                    <div className="line-clamp-2 whitespace-pre-wrap">{r.comment}</div>
                  </td>
                  <td className="px-3 py-2">
                    {r.responded ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        Sí
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <form action={generateForId} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                      >
                        Generar IA
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: las reviews de prueba se asocian siempre a <code className="font-mono">{FIXED_LOCATION_ID}</code>.
      </p>
    </div>
  );
}
