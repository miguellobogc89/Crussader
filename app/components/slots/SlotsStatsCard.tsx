"use client";

import { useEffect, useState } from "react";
import { Euro, RefreshCw, TrendingUp } from "lucide-react";

type Props = {
  companyId: string | null;
  locationId?: string | null;
};

export function SlotsStatsCard({ companyId, locationId }: Props) {
  const [recovered, setRecovered] = useState<number>(0);
  const [recoveredTotal, setRecoveredTotal] = useState<number>(0);
  const [recoveredAmount, setRecoveredAmount] = useState<number>(0);
  const [bookingConversion, setBookingConversion] = useState<number>(0);

  useEffect(() => {
    if (!locationId || !companyId) {
      setRecovered(0);
      setRecoveredTotal(0);
      setRecoveredAmount(0);
      setBookingConversion(0);
      return;
    }

    const controller = new AbortController();

    const fetchKpis = async () => {
      try {
        const params = new URLSearchParams();
        params.set("companyId", companyId);
        params.set("locationId", locationId);

        const res = await fetch(`/api/slots/kpis?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data?.ok) {
          setRecovered(0);
          setRecoveredTotal(0);
          setRecoveredAmount(0);
          setBookingConversion(0);
          return;
        }

        setRecovered(Number(data.kpis?.recovered ?? 0));
        setRecoveredTotal(Number(data.kpis?.recoveredTotal ?? 0));
        setRecoveredAmount(Number(data.kpis?.recoveredAmount ?? 0));
        setBookingConversion(Number(data.kpis?.bookingConversion ?? 0));
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setRecovered(0);
        setRecoveredTotal(0);
        setRecoveredAmount(0);
        setBookingConversion(0);
      }
    };

    void fetchKpis();

    return () => controller.abort();
  }, [companyId, locationId]);

  const stats = [
    {
      id: "income",
      label: "Ingresos recuperados",
      value: `${recoveredAmount.toLocaleString("es-ES", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}€`,
      sub: "",
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
      id: "booking-conversion",
      label: "Tasa de conversión",
      value: `${bookingConversion}%`,
      sub: "de clientes contactados",
      Icon: TrendingUp,
    }
  ];

  return (
    <div className="flex items-center gap-6">
      {stats.map((stat) => {
        const Icon = stat.Icon;

        return (
          <div key={stat.id} className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-crussader/10">
              <Icon className="h-4 w-4 text-crussader" />
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