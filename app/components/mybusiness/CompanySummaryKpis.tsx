"use client";

import { useEffect, useState } from "react";

export default function CompanySummaryKpis({ companyId }: { companyId: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [unanswered, setUnanswered] = useState<number | null>(null);

  useEffect(() => {
    if (!companyId) return;
    (async () => {
      try {
        const res = await fetch(`/api/companies/${companyId}/kpis`, { cache: "no-store" });
        const json = await res.json();
        if (!json?.ok || !json.data) return;

        const r = json.data;
        setRating(r.rates.avgAll ?? null);
        setUnanswered(r.totals.unansweredCount ?? null);
      } catch (err) {
        console.warn("[CompanySummaryKpis] error", err);
      }
    })();
  }, [companyId]);

  if (!companyId) return null;

return (
  <div className="flex flex-col items-end text-right text-xs sm:text-sm text-muted-foreground leading-tight space-y-1">
    <div>
      {rating != null ? (
        <>
          La valoración media de la empresa es{" "}
          <span className="font-semibold text-foreground">{rating.toFixed(1)}★</span>
        </>
      ) : (
        "Cargando valoración media..."
      )}
    </div>
    <div>
      {unanswered != null ? (
        <>
          Actualmente hay{" "}
          <span className="font-semibold text-foreground">{unanswered}</span>{" "}
          reseñas sin contestar
        </>
      ) : (
        "Cargando reseñas sin contestar..."
      )}
    </div>
  </div>
);

}
