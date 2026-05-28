// app/components/slots/SlotsStatsCard.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Euro, RotateCcw, Send } from "lucide-react";

type Props = {
  companyId: string | null;
  locationId?: string | null;
};

function AnimatedValue({ value }: { value: string | number }) {
  const [pulse, setPulse] = useState(false);
  const previousValue = useRef(value);

  useEffect(() => {
    if (previousValue.current === value) {
      return;
    }

    previousValue.current = value;
    setPulse(true);

    const timeoutId = window.setTimeout(() => {
      setPulse(false);
    }, 320);

    return () => window.clearTimeout(timeoutId);
  }, [value]);

  return (
    <span
      className={[
        "tabular-nums text-base font-semibold text-foreground transition-transform duration-300 ease-out",
        pulse ? "scale-125" : "scale-100",
      ].join(" ")}
    >
      {value}
    </span>
  );
}

export function SlotsStatsCard({ companyId, locationId }: Props) {
  const [recovered, setRecovered] = useState<number>(0);
  const [recoveredTotal, setRecoveredTotal] = useState<number>(0);
  const [recoveredAmount, setRecoveredAmount] = useState<number>(0);
  const [sentMessages, setSentMessages] = useState<number>(0);

  useEffect(() => {
    if (!locationId || !companyId) {
      setRecovered(0);
      setRecoveredTotal(0);
      setRecoveredAmount(0);
      setSentMessages(0);
      return;
    }

    let isMounted = true;

    const fetchKpis = async () => {
      try {
        const params = new URLSearchParams();
        params.set("companyId", companyId);
        params.set("locationId", locationId);

        const res = await fetch(`/api/slots/kpis?${params.toString()}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!isMounted) {
          return;
        }

        if (!res.ok || !data?.ok) {
          return;
        }

        setRecovered(Number(data.kpis?.recovered ?? 0));
        setRecoveredTotal(Number(data.kpis?.recoveredTotal ?? 0));
        setRecoveredAmount(Number(data.kpis?.recoveredAmount ?? 0));
        setSentMessages(Number(data.kpis?.sentMessages ?? 0));
      } catch {
        // No limpiamos los datos para evitar parpadeos.
      }
    };

    void fetchKpis();

    const intervalId = window.setInterval(() => {
      void fetchKpis();
    }, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [companyId, locationId]);

  const formattedAmount = `${recoveredAmount.toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}€`;

  const stats = [
    {
      id: "income",
      label: "Ingresos recuperados",
      value: formattedAmount,
      sub: "",
      Icon: Euro,
    },
    {
      id: "recovered",
      label: "Huecos rescatados",
      value: recovered,
      sub: `de ${recoveredTotal}`,
      Icon: RotateCcw,
    },
{
  id: "sent-messages",
  label: "Invitaciones enviadas",
  value: sentMessages,
  sub: "este mes",
  Icon: Send,
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
                <AnimatedValue value={stat.value} />

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