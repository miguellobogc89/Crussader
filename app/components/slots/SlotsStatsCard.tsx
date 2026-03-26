"use client";

import { useEffect, useState } from "react";
import { slotStatsMock } from "./slots.mock";
import { RefreshCw, Send, TrendingUp } from "lucide-react";

const ICONS: Record<string, any> = {
  recovered: RefreshCw,
  messages: Send,
  "response-rate": TrendingUp,
};

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

  return (
    <div className="flex items-center gap-6 border-b border-border pb-3">
      {slotStatsMock.map((stat) => {
        const Icon = ICONS[stat.id];

        const value = stat.id === "recovered" ? recovered : stat.value;
        const sub =
          stat.id === "recovered" ? `de ${recoveredTotal}` : stat.sub;

        return (
          <div
            key={stat.id}
            className="flex items-center gap-3 min-w-0"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-crussader/10">
              {Icon && <Icon className="h-4 w-4 text-crussader" />}
            </div>

            <div className="flex flex-col leading-tight">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                {stat.label}
              </span>

              <div className="flex items-baseline gap-1">
                <span className="text-base font-semibold text-foreground tabular-nums">
                  {value}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {sub}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}