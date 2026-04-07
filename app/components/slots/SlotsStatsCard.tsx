// app/components/slots/SlotsStatsCard.tsx
"use client";

import { useEffect, useState } from "react";
import { Euro, RefreshCw, TrendingUp, Zap } from "lucide-react";

type Props = {
  companyId: string;
  locationId?: string | null;
};

export function SlotsStatsCard({ companyId, locationId }: Props) {
  const [recovered, setRecovered] = useState<number>(0);
  const [recoveredTotal, setRecoveredTotal] = useState<number>(0);

  useEffect(() => {
    const fetchKpis = async () => {
      const params = new URLSearchParams({
        companyId,
      });

      if (locationId) {
        params.append("locationId", locationId);
      }

      const res = await fetch(`/api/slots/kpis?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setRecovered(data.kpis.recovered);
        setRecoveredTotal(data.kpis.recoveredTotal);
      }
    };

    fetchKpis();
  }, [companyId, locationId]);

  const stats = [
    {
      id: "income",
      label: "Ingresos recuperados",
      value: "1.840€",
      sub: "(+12%)",
      Icon: Euro,
    },
    {
      id: "recovered",
      label: "Huecos rescatados",
      value: recovered,
      sub: `de ${recoveredTotal}`,
      Icon: RefreshCw,
    },
    {
      id: "response-rate",
      label: "Tasa de respuesta",
      value: "68%",
      sub: "",
      Icon: TrendingUp,
    },
    {
      id: "urgent",
      label: "Urgencias activas",
      value: "4",
      sub: "",
      Icon: Zap,
      iconClassName: "text-orange-500",
    },
  ];

  return (
    <div className="flex items-center gap-6">
      {stats.map((stat) => {
        const Icon = stat.Icon;

        return (
          <div
            key={stat.id}
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-crussader/10">
              <Icon
                className={[
                  "h-4 w-4",
                  stat.iconClassName ?? "text-crussader",
                ].join(" ")}
              />
            </div>

            <div className="flex flex-col leading-tight">
              <span className="whitespace-nowrap text-[11px] text-muted-foreground">
                {stat.label}
              </span>

              <div className="flex items-baseline gap-1">
                <span className="tabular-nums text-base font-semibold text-foreground">
                  {stat.value}
                </span>

                {stat.sub ? (
                  <span className="text-[11px] text-muted-foreground">
                    {stat.sub}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}