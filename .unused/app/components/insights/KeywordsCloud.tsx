// app/components/insights/KeywordsCloud.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";

type Row = { term: string; count: number };
type Payload = {
  topUnigramsPos: Row[];
  topUnigramsNeg: Row[];
  topBigramsPos: Row[];
  topBigramsNeg: Row[];
  totals: { pos: number; neg: number };
};
type Meta = {
  companyId: string | null;
  locationId: string | null;
  detectedTextColumns?: {
    known: string[];
    others: string[];
    all: string[];
  };
  rawCount?: number;
  usefulCount?: number;
  sampleTexts?: string[];
  reason?: string;
};

export default function KeywordsCloud({
  companyId,
  locationId,
}: {
  companyId: string;
  locationId?: string | null;
}) {
  const [data, setData] = useState<Payload | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    const qs = new URLSearchParams({
      companyId,
      ...(locationId ? { locationId } : {}),
      topN: "40",
      limit: "3000",
      windowDays: "180",
    });
    fetch(`/api/reviews/keywords?${qs.toString()}`, { cache: "no-store" })
      .then(async (r) => {
        const text = await r.text();
        try {
          return JSON.parse(text);
        } catch {
          return { ok: false, error: "invalid_json", raw: text };
        }
      })
      .then((json) => {
        setData(json?.data ?? null);
        setMeta(json?.meta ?? null);
      })
      .finally(() => setLoading(false));
  }, [companyId, locationId]);

  const renderChips = (rows: Row[], tone: "pos" | "neg") => (
    <div className="flex flex-wrap gap-2">
      {rows.map((r) => (
        <span
          key={tone + r.term}
          className={`px-2 py-1 rounded-full text-xs border ${
            tone === "pos"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
          title={`${r.count} ocurrencias`}
        >
          {r.term} <span className="opacity-60">({r.count})</span>
        </span>
      ))}
    </div>
  );

  const rawCount = meta?.rawCount ?? null;
  const usefulCount = meta?.usefulCount ?? null;

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <div>
          <CardTitle>Palabras más frecuentes</CardTitle>
          <CardDescription>Separadas por sentimiento (según estrellas)</CardDescription>
        </div>
        <button
          type="button"
          onClick={() => setShowDebug((v) => !v)}
          className="text-xs text-muted-foreground hover:underline"
        >
          {showDebug ? "Ocultar debug" : "Mostrar debug"}
        </button>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading && <div className="text-sm text-muted-foreground">Analizando reseñas…</div>}

        <div className="flex gap-6 text-sm">
          <div className="inline-flex items-center gap-2 rounded-xl border bg-background px-3.5 py-2">
            <span className="opacity-70">Reseñas encontradas:</span>
            <b>{rawCount ?? "—"}</b>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border bg-background px-3.5 py-2">
            <span className="opacity-70">Textos útiles analizados:</span>
            <b>{usefulCount ?? "—"}</b>
          </div>
        </div>

        {!loading && data && (data.topUnigramsPos.length + data.topUnigramsNeg.length +
          data.topBigramsPos.length + data.topBigramsNeg.length > 0) && (
          <>
            <div>
              <div className="text-sm font-medium mb-2">Unigramas — Positivas</div>
              {renderChips(data.topUnigramsPos, "pos")}
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Unigramas — Negativas</div>
              {renderChips(data.topUnigramsNeg, "neg")}
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Bigramas — Positivas</div>
              {renderChips(data.topBigramsPos, "pos")}
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Bigramas — Negativas</div>
              {renderChips(data.topBigramsNeg, "neg")}
            </div>
          </>
        )}

        {!loading && (!data || (usefulCount ?? 0) === 0) && (
          <div className="text-sm text-muted-foreground">Sin datos suficientes.</div>
        )}

        {showDebug && (
          <div className="mt-4 border rounded p-3 bg-muted/20">
            <div className="text-sm font-medium mb-2">Diagnóstico</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <div className="opacity-70">CompanyId:</div>
                <div className="font-mono">{meta?.companyId ?? "—"}</div>
                <div className="opacity-70 mt-2">LocationId:</div>
                <div className="font-mono">{meta?.locationId ?? "—"}</div>
              </div>
              <div>
                <div className="opacity-70">Columnas detectadas (texto):</div>
                <div className="font-mono break-all">{meta?.detectedTextColumns?.all?.join(", ") || "—"}</div>
                <div className="opacity-70 mt-2">Columnas preferidas:</div>
                <div className="font-mono break-all">{meta?.detectedTextColumns?.known?.join(", ") || "—"}</div>
              </div>
              <div>
                <div className="opacity-70">Muestra (3):</div>
                <pre className="text-xs bg-muted/30 border rounded p-2 max-h-40 overflow-auto">
{JSON.stringify(meta?.sampleTexts ?? [], null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
