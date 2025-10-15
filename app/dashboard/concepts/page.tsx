"use client";

/**
 * app/dashboard/concepts/page.tsx
 * =========================================================
 * Propósito:
 * - Mostrar conceptos existentes (badges verde/rojo).
 * - Mostrar topics (accordion con sus concepts).
 * - Botón "Calcular topics" que llama a /api/.../llm-group vía GET (compatible navegador).
 *
 * Endpoints que usa:
 * - GET /api/reviews/tasks/concepts/list   (opcional; si no existe, hace fallback)
 * - GET /api/concepts/summary              (fallback para concepts)
 * - GET /api/reviews/tasks/topics/list     (topics existentes)
 * - GET /api/reviews/tasks/topics/llm-group?run=1&dryRun=0   (calcula y persiste)
 *
 * Notas:
 * - Si no hay concepts, lo indica.
 * - Si no hay topics, lo indica y ofrece calcular.
 * - Tras calcular topics, refresca la lista automáticamente.
 * =========================================================
 */

import React from "react";

type Concept = {
  id: string;
  label: string;
  avg_rating?: number | null;
  review_count?: number | null;
};

type Topic = {
  id: string;
  label: string;
  description?: string | null;
  concept_count?: number | null;
  avg_rating?: number | null;
  is_stable?: boolean | null;
  concepts: Array<{ id: string; label: string; avg_rating?: number | null }>;
};

export default function ConceptsAndTopicsPage() {
  const [concepts, setConcepts] = React.useState<Concept[]>([]);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingTopics, setLoadingTopics] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);

  React.useEffect(() => {
    void refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshAll() {
    setError(null);
    setToast(null);
    setLoading(true);
    try {
      const [conceptList, topicList] = await Promise.all([
        loadConceptsWithFallback(),
        loadTopics(),
      ]);
      setConcepts(conceptList);
      setTopics(topicList);
    } catch (e: any) {
      setError(e?.message || "Error cargando datos.");
    } finally {
      setLoading(false);
    }
  }

async function loadConceptsWithFallback(): Promise<Concept[]> {
  // 1) Endpoint nuevo
  try {
    const res = await fetch("/api/reviews/tasks/concepts/list", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json?.ok && Array.isArray(json?.concepts)) {
        // Admite tanto {avg_rating} como {rating}
        return (json.concepts as any[]).map((c, i) => ({
          id: String(c.id ?? i),
          label: String(c.label ?? "Concepto"),
          avg_rating:
            typeof c.avg_rating === "number"
              ? c.avg_rating
              : typeof c.rating === "number"
              ? c.rating
              : null,
          review_count:
            typeof c.review_count === "number" ? c.review_count : null,
        }));
      }
    }
  } catch {
    // ignore
  }

  // 2) Fallback antiguo
  try {
    const res = await fetch("/api/concepts/summary", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (Array.isArray(json)) {
      return json.map((x: any, i: number) => ({
        id: String(i),
        label: String(x.topic ?? x.label ?? "Concepto"),
        avg_rating: typeof x.avgRating === "number" ? x.avgRating : null,
        review_count: typeof x.docs === "number" ? x.docs : null,
      })) as Concept[];
    }
    if (Array.isArray(json?.items)) {
      return json.items.map((x: any, i: number) => ({
        id: String(i),
        label: String(x.topic ?? x.label ?? "Concepto"),
        avg_rating: typeof x.avgRating === "number" ? x.avgRating : null,
        review_count: typeof x.docs === "number" ? x.docs : null,
      })) as Concept[];
    }
  } catch {
    // ignore
  }

  return [];
}


  async function loadTopics(): Promise<Topic[]> {
    const res = await fetch("/api/reviews/tasks/topics/list", { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} en /topics/list`);
    }
    const json = await res.json();
    if (!json?.ok) throw new Error(json?.error || "Respuesta no OK en /topics/list");
    const topics = (json.topics || []) as Topic[];
    // aseguremos campo concepts
    for (const t of topics) {
      // @ts-ignore
      if (!Array.isArray(t.concepts) && Array.isArray((t as any).concept)) {
        // Prisma venía como t.concept, lo normalizamos:
        // @ts-ignore
        t.concepts = (t as any).concept;
        // @ts-ignore
        delete (t as any).concept;
      }
      if (!Array.isArray(t.concepts)) t.concepts = [];
    }
    return topics;
  }

  async function handleCalcTopics() {
    setLoadingTopics(true);
    setError(null);
    setToast(null);
    try {
      // GET compatible con navegador (persiste):
      const url = "/api/reviews/tasks/topics/llm-group?run=1&dryRun=0&limit=200&includeAssigned=0";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status} al calcular topics`);
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error || "Falló el cálculo de topics");
      setToast(
        `Topics creados: ${json?.createdTopics ?? 0}. Concepts asignados: ${json?.assignedConcepts ?? 0}.`
      );
      // refrescar lista de topics
      const t = await loadTopics();
      setTopics(t);
    } catch (e: any) {
      setError(e?.message || "Error creando topics");
    } finally {
      setLoadingTopics(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Conceptos & Topics</h1>
          <p className="text-sm text-gray-500">
            Primero se muestran todos los conceptos disponibles. Debajo, los topics (si existen).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshAll}
            className="px-3 py-2 rounded-lg border text-sm hover:bg-gray-50"
            disabled={loading || loadingTopics}
            title="Recargar datos"
          >
            {loading ? "Actualizando..." : "Actualizar"}
          </button>

          <button
            onClick={handleCalcTopics}
            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
            disabled={loading || loadingTopics}
            title="Agrupar concepts en topics (persistir)"
          >
            {loadingTopics ? "Calculando topics..." : "Calcular topics"}
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
          {error}
        </div>
      )}
      {toast && (
        <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-3">
          {toast}
        </div>
      )}

      {/* CONCEPTS */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Conceptos existentes</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Cargando conceptos…</p>
        ) : concepts.length === 0 ? (
          <div className="text-sm text-gray-500">
            No hay conceptos todavía. Ejecuta la conceptualización primero.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {concepts.map((c) => {
              const ok = (c.avg_rating ?? 0) >= 3;
              const tone = ok
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200";
              return (
                <span
                  key={c.id}
                  className={`inline-flex items-center gap-2 border px-3 py-1 rounded-full text-sm ${tone}`}
                  title={`Valoración media: ${
                    c.avg_rating ?? "—"
                  } · Docs: ${c.review_count ?? "—"}`}
                >
                  <span className="truncate max-w-[52ch]" title={c.label}>
                    {c.label}
                  </span>
                  <span className="text-xs opacity-70">
                    {typeof c.avg_rating === "number" ? `★${c.avg_rating.toFixed(2)}` : "★—"}
                  </span>
                  {typeof c.review_count === "number" && (
                    <span className="text-xs opacity-70">· {c.review_count}</span>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </section>

      {/* TOPICS */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Topics</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Cargando topics…</p>
        ) : topics.length === 0 ? (
          <div className="text-sm text-gray-500">
            No hay topics todavía. Pulsa <b>Calcular topics</b>.
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((t) => (
              <details key={t.id} className="rounded-lg border">
                <summary className="cursor-pointer select-none px-4 py-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.label}</div>
                    {t.description && (
                      <div className="text-sm text-gray-500 truncate">{t.description}</div>
                    )}
                  </div>
                  <div className="ml-4 shrink-0 text-sm text-gray-500">
                    {typeof t.concept_count === "number" ? `${t.concept_count} concepts` : ""}
                    {typeof t.avg_rating === "number" ? ` · ★${t.avg_rating.toFixed(2)}` : ""}
                    {t.is_stable ? " · estable" : ""}
                  </div>
                </summary>

                <div className="px-4 pb-4">
                  {t.concepts?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {t.concepts.map((c) => {
                        const ok = (c.avg_rating ?? 0) >= 3;
                        const tone = ok
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-red-50 text-red-800 border-red-200";
                        return (
                          <span
                            key={c.id}
                            className={`inline-flex items-center gap-2 border px-3 py-1 rounded-full text-sm ${tone}`}
                            title={`Valoración media: ${
                              c.avg_rating ?? "—"
                            } · Pertenece a este topic`}
                          >
                            <span className="truncate max-w-[52ch]" title={c.label}>
                              {c.label}
                            </span>
                            <span className="text-xs opacity-70">
                              {typeof c.avg_rating === "number"
                                ? `★${c.avg_rating.toFixed(2)}`
                                : "★—"}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">Este topic no tiene concepts listados.</div>
                  )}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
