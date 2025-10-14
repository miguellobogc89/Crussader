// app/dashboard/informes/candidatos/page.tsx
"use client";

import { useEffect, useState } from "react";
import PageShell from "@/app/components/layouts/PageShell";
import { CompanyLocationShell } from "@/app/components/crussader/CompanyLocationShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

type Candidate = {
  id: string;
  ngram: string;
  kind: "unigram" | "bigram";
  docs_unique: number;
  freq_pos: number;
  freq_neg: number;
  freq_neu: number;
  examples: string[] | null;
  status: string;
  suggested_name?: string | null;
  suggested_description?: string | null;
  last_seen_at?: string;
};

export default function CandidatesPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [locationId, setLocationId] = useState<string | null>(null);

  const [list, setList] = useState<Candidate[]>([]);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState<any>(null);

  const loadList = async () => {
    if (!companyId && !locationId) return;
    const qs = new URLSearchParams({
      ...(companyId ? { companyId } : {}),
      ...(locationId ? { locationId } : {}),
      limit: "100",
    });
    const res = await fetch(`/api/themes/candidates?${qs.toString()}`, { cache: "no-store" });
    const text = await res.text();
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch { json = null; }
    setDebug((d: any) => ({ ...(d ?? {}), listFetch: { ok: res.ok, status: res.status, body: text?.slice(0, 500) } }));
    setList(Array.isArray(json?.data) ? json.data : []);
  };

  const runSync = async () => {
    if (!companyId && !locationId) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        ...(companyId ? { companyId } : {}),
        ...(locationId ? { locationId } : {}),
        topN: "40",
        windowDays: "365",
        limit: "3000",
      });
      const res = await fetch(`/api/themes/candidates/sync?${qs.toString()}`, { method: "POST", cache: "no-store" });
      const text = await res.text();
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }
      setDebug((d: any) => ({ ...(d ?? {}), syncFetch: { ok: res.ok, status: res.status, body: text?.slice(0, 700) } }));
      setSyncResult(json?.data ?? null);
      await loadList();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadList(); }, [companyId, locationId]);

  return (
    <PageShell
      title="Candidatos de temas"
      description="N-gramas frecuentes por sentimiento (para promover a temas)"
      toolbar={
        <div className="flex items-end gap-3">
          <CompanyLocationShell
            onChange={({ companyId: cId, locationId: lId }) => {
              setCompanyId(cId ?? null);
              setLocationId(lId ?? null);
            }}
          />
          <button
            onClick={runSync}
            className="px-3 py-2 rounded border text-sm"
            disabled={loading || (!companyId && !locationId)}
            title="Analizar reseñas y guardar candidatos"
          >
            {loading ? "Analizando…" : "Analizar y guardar"}
          </button>
        </div>
      }
      backFallback="/dashboard/informes"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Resultado de sincronización</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-muted-foreground">
              scope → companyId: <b>{companyId ?? "—"}</b> · locationId: <b>{locationId ?? "—"}</b>
            </div>
            <pre className="text-xs rounded bg-muted/40 p-3 overflow-x-auto">
              {JSON.stringify(syncResult ?? { info: "Pulsa Analizar y guardar…" }, null, 2)}
            </pre>
            {/* Debug de red */}
            {debug && (
              <details className="text-xs">
                <summary className="cursor-pointer">Debug HTTP</summary>
                <pre className="mt-2 rounded bg-muted/40 p-3 overflow-x-auto">{JSON.stringify(debug, null, 2)}</pre>
              </details>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Listado de candidatos ({list.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {list.length === 0 ? (
              <div className="text-sm text-muted-foreground">No hay candidatos aún.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground">
                    <tr>
                      <th className="text-left py-2 pr-3">N-grama</th>
                      <th className="text-left py-2 pr-3">Tipo</th>
                      <th className="text-right py-2 pr-3">Docs</th>
                      <th className="text-right py-2 pr-3">Pos</th>
                      <th className="text-right py-2 pr-3">Neg</th>
                      <th className="text-right py-2 pr-3">Neu</th>
                      <th className="text-left py-2 pr-3">Ejemplos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="py-2 pr-3">{r.ngram}</td>
                        <td className="py-2 pr-3">{r.kind}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{r.docs_unique}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{r.freq_pos}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{r.freq_neg}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{r.freq_neu}</td>
                        <td className="py-2 pr-3 max-w-[420px]">
                          <div className="flex flex-wrap gap-2">
                            {(r.examples ?? []).slice(0, 3).map((e, i) => (
                              <span key={i} className="px-2 py-1 rounded bg-muted text-xs">{e}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
