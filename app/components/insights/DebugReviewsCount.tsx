
// app/components/insights/DebugReviewsCount.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";

export default function DebugReviewsCount({
  companyId,
  locationId,
}: {
  companyId?: string | null;
  locationId?: string | null;
}) {
  const [resp, setResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!companyId && !locationId) {
      setResp(null);
      return;
    }
    setLoading(true);
    const qs = new URLSearchParams({
      ...(companyId ? { companyId } : {}),
      ...(locationId ? { locationId } : {}),
    });
    fetch(`/api/debug/reviews-count?${qs.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        console.log("[DebugReviewsCount] ->", j);
        setResp(j);
      })
      .finally(() => setLoading(false));
  }, [companyId, locationId]);

  const total = resp?.data?.total ?? null;
  const sample = resp?.data?.sample ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>DEBUG · Reviews (count + sample)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <span className="opacity-70">companyId:</span>{" "}
          <code>{companyId ?? "—"}</code>{" "}
          <span className="opacity-70 ml-3">locationId:</span>{" "}
          <code>{locationId ?? "—"}</code>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando…</div>
        ) : (
          <>
            <div className="text-sm">
              <span className="opacity-70">Total filas:</span>{" "}
              <b>{total ?? "—"}</b>
            </div>

            <div className="text-xs">
              <div className="opacity-70 mb-1">Muestra (máx 5):</div>
              <pre className="max-h-64 overflow-auto bg-muted/30 border rounded p-2">
{JSON.stringify(sample, null, 2)}
              </pre>
            </div>

            <details className="text-xs mt-2">
              <summary className="cursor-pointer opacity-70">SQL</summary>
              <pre className="overflow-auto bg-muted/30 border rounded p-2 mt-2">
{JSON.stringify(resp?.meta ?? {}, null, 2)}
              </pre>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
}
