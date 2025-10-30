"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  conceptId: string;
  conceptLabel: string;
  sentiment: string | null;
  relevance: number | null;
  conceptRating: number | null;
  reviewId: string | null;
  reviewRating: number | null;
  reviewCreatedAt: string | null; // ISO
  reviewComment: string | null;
  locationId: string | null;
  locationTitle: string | null;
  companyId: string | null;
  companyName: string | null;
  topicId: string | null;
  topicLabel: string | null;
};

type SortKey =
  | "conceptId"
  | "conceptLabel"
  | "sentiment"
  | "relevance"
  | "topicLabel"
  | "reviewId"
  | "reviewRating"
  | "reviewCreatedAt"
  | "locationTitle"
  | "companyName";

type SortDir = "asc" | "desc";

export default function SentimentAdminPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Filtros por columna
  const [qConcept, setQConcept] = useState("");
  const [qSentiment, setQSentiment] = useState("");
  const [qTopic, setQTopic] = useState("");
  const [qReview, setQReview] = useState("");
  const [qLocation, setQLocation] = useState("");
  const [qCompany, setQCompany] = useState("");
  const [ratingMin, setRatingMin] = useState<string>("");
  const [ratingMax, setRatingMax] = useState<string>("");

  // Búsqueda global rápida
  const [qGlobal, setQGlobal] = useState("");

  // Ordenación
  const [sortKey, setSortKey] = useState<SortKey>("reviewCreatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/reviews/sentiment", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRows(data.rows ?? []);
      } catch (e: any) {
        setErr(e?.message ?? "Error cargando datos");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleSort = (key: SortKey) => {
    setSortKey((prev) => {
      if (prev !== key) {
        setSortDir("asc");
        return key;
      }
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return key;
    });
  };

  const filtered = useMemo(() => {
    const norm = (s: unknown) => (s ?? "").toString().toLowerCase();

    const min = ratingMin !== "" ? Number(ratingMin) : null;
    const max = ratingMax !== "" ? Number(ratingMax) : null;

    return rows.filter((r) => {
      // Global
      if (qGlobal) {
        const haystack = [
          r.conceptId,
          r.conceptLabel,
          r.sentiment,
          r.topicLabel,
          r.reviewId,
          r.reviewComment,
          r.locationTitle,
          r.locationId,
          r.companyName,
          r.companyId,
        ]
          .map(norm)
          .join(" ");
        if (!haystack.includes(qGlobal.toLowerCase())) return false;
      }

      // Por columna
      if (qConcept && !norm(r.conceptLabel).includes(qConcept.toLowerCase())) return false;
      if (qSentiment && !norm(r.sentiment).includes(qSentiment.toLowerCase())) return false;
      if (qTopic && !norm(r.topicLabel).includes(qTopic.toLowerCase())) return false;
      if (qReview && !norm(r.reviewComment).includes(qReview.toLowerCase())) return false;
      if (qLocation && !norm(r.locationTitle ?? r.locationId).includes(qLocation.toLowerCase()))
        return false;
      if (qCompany && !norm(r.companyName ?? r.companyId).includes(qCompany.toLowerCase()))
        return false;

      if (min !== null && (r.reviewRating ?? -Infinity) < min) return false;
      if (max !== null && (r.reviewRating ?? Infinity) > max) return false;

      return true;
    });
  }, [
    rows,
    qGlobal,
    qConcept,
    qSentiment,
    qTopic,
    qReview,
    qLocation,
    qCompany,
    ratingMin,
    ratingMax,
  ]);

  const sorted = useMemo(() => {
    const val = (r: Row, k: SortKey) => {
      switch (k) {
        case "conceptId":
          return r.conceptId;
        case "conceptLabel":
          return r.conceptLabel ?? "";
        case "sentiment":
          return r.sentiment ?? "";
        case "relevance":
          return r.relevance ?? -Infinity;
        case "topicLabel":
          return r.topicLabel ?? "";
        case "reviewId":
          return r.reviewId ?? "";
        case "reviewRating":
          return r.reviewRating ?? -Infinity;
        case "reviewCreatedAt":
          return r.reviewCreatedAt ? new Date(r.reviewCreatedAt).getTime() : 0;
        case "locationTitle":
          return r.locationTitle ?? "";
        case "companyName":
          return r.companyName ?? "";
      }
    };

    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = val(a, sortKey);
      const bv = val(b, sortKey);
      if (av === bv) return 0;
      // string vs number
      if (typeof av === "number" && typeof bv === "number") return av < bv ? -dir : dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [filtered, sortKey, sortDir]);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Cargando…</div>;
  if (err) return <div className="p-6 text-red-600 text-sm">Error: {err}</div>;

  const Th = ({
    label,
    k,
    className,
  }: {
    label: string;
    k: SortKey;
    className?: string;
  }) => (
    <th
      className={`text-left p-2 select-none cursor-pointer ${className ?? ""}`}
      onClick={() => toggleSort(k)}
      title="Ordenar"
    >
      <div className="inline-flex items-center gap-1">
        <span>{label}</span>
        <span className="text-xs opacity-60">
          {sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
        </span>
      </div>
    </th>
  );

  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      className={`w-full rounded border px-2 py-1 text-xs bg-background ${
        props.className ?? ""
      }`}
    />
  );

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold mb-4">Admin · Reviews · Sentiment</h1>

      {/* Barra de herramientas */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar en todo…"
          value={qGlobal}
          onChange={(e) => setQGlobal(e.target.value)}
        />
        <div className="text-xs text-muted-foreground">
          {sorted.length} resultados (de {rows.length})
        </div>
        <button
          className="ml-auto text-xs px-2 py-1 border rounded hover:bg-muted"
          onClick={() => {
            setQGlobal("");
            setQConcept("");
            setQSentiment("");
            setQTopic("");
            setQReview("");
            setQLocation("");
            setQCompany("");
            setRatingMin("");
            setRatingMax("");
          }}
        >
          Limpiar filtros
        </button>
      </div>

      <div className="overflow-auto border rounded-md">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <Th label="Concept ID" k="conceptId" className="w-[210px]" />
              <Th label="Concept" k="conceptLabel" />
              <Th label="Sentiment" k="sentiment" />
              <Th label="Rel." k="relevance" />
              <Th label="Topic" k="topicLabel" />
              <Th label="Review ID" k="reviewId" />
              <Th label="Rating" k="reviewRating" />
              <Th label="Fecha" k="reviewCreatedAt" />
              <th className="text-left p-2">Comentario</th>
              <Th label="Location" k="locationTitle" />
              <Th label="Company" k="companyName" />
            </tr>
            {/* Fila de filtros por columna */}
            <tr className="border-t">
              <th className="p-2">
                <Input
                  placeholder="contiene…"
                  value={qConcept ? undefined : ""} // no filtramos por ID, dejamos libre
                  readOnly
                  title="Filtro no aplicado en ID"
                />
              </th>
              <th className="p-2">
                <Input
                  placeholder="Concept…"
                  value={qConcept}
                  onChange={(e) => setQConcept(e.target.value)}
                />
              </th>
              <th className="p-2">
                <Input
                  placeholder="Sentiment…"
                  value={qSentiment}
                  onChange={(e) => setQSentiment(e.target.value)}
                />
              </th>
              <th className="p-2">
                <Input placeholder="—" readOnly />
              </th>
              <th className="p-2">
                <Input
                  placeholder="Topic…"
                  value={qTopic}
                  onChange={(e) => setQTopic(e.target.value)}
                />
              </th>
              <th className="p-2">
                <Input placeholder="—" readOnly />
              </th>
              <th className="p-2">
                <div className="flex items-center gap-1">
                  <Input
                    placeholder="min"
                    value={ratingMin}
                    onChange={(e) => setRatingMin(e.target.value)}
                    inputMode="numeric"
                    className="w-16"
                  />
                  <span>–</span>
                  <Input
                    placeholder="max"
                    value={ratingMax}
                    onChange={(e) => setRatingMax(e.target.value)}
                    inputMode="numeric"
                    className="w-16"
                  />
                </div>
              </th>
              <th className="p-2">
                <Input placeholder="—" readOnly />
              </th>
              <th className="p-2">
                <Input
                  placeholder="Texto review…"
                  value={qReview}
                  onChange={(e) => setQReview(e.target.value)}
                />
              </th>
              <th className="p-2">
                <Input
                  placeholder="Location…"
                  value={qLocation}
                  onChange={(e) => setQLocation(e.target.value)}
                />
              </th>
              <th className="p-2">
                <Input
                  placeholder="Company…"
                  value={qCompany}
                  onChange={(e) => setQCompany(e.target.value)}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.conceptId} className="border-t align-top">
                <td className="p-2 font-mono text-[11px]">{r.conceptId}</td>
                <td className="p-2">{r.conceptLabel}</td>
                <td className="p-2">{r.sentiment ?? "—"}</td>
                <td className="p-2">{r.relevance ?? "—"}</td>
                <td className="p-2">
                  {r.topicLabel ? (
                    <>
                      <div>{r.topicLabel}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{r.topicId}</div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-2">
                  <span className="font-mono text-[11px]">{r.reviewId ?? "—"}</span>
                </td>
                <td className="p-2">{r.reviewRating ?? "—"}</td>
                <td className="p-2">
                  {r.reviewCreatedAt ? new Date(r.reviewCreatedAt).toLocaleDateString() : "—"}
                </td>
                <td className="p-2 max-w-[420px]">
                  <div className="truncate" title={r.reviewComment ?? ""}>
                    {r.reviewComment ?? "—"}
                  </div>
                </td>
                <td className="p-2">
                  {r.locationTitle ? (
                    <>
                      <div>{r.locationTitle}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{r.locationId}</div>
                    </>
                  ) : (
                    <span className="font-mono text-[11px]">{r.locationId ?? "—"}</span>
                  )}
                </td>
                <td className="p-2">
                  {r.companyName ? (
                    <>
                      <div>{r.companyName}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">{r.companyId}</div>
                    </>
                  ) : (
                    <span className="font-mono text-[11px]">{r.companyId ?? "—"}</span>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td className="p-4 text-center text-muted-foreground" colSpan={11}>
                  Sin datos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
