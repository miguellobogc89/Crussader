// app/components/slots/SlotsActivityFeedCard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Send,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import StandardCard from "@/app/components/crussader/UX/standardCard";
import { ScrollArea } from "@/app/components/ui/scroll-area";

type ActivityItem = {
  id: string;
  text: string;
  time: string;
  status: string;
};

function getRecoveredToday(items: ActivityItem[]) {
  return items.filter((item) => item.status === "slot_booked").length;
}

function getItemVisual(status: string) {
  if (status === "slot_booked") {
    return {
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      iconBg: "bg-emerald-50",
      rowBg: "bg-emerald-50/60",
    };
  }

  if (status === "booking_missed") {
    return {
      icon: Clock,
      iconColor: "text-amber-500",
      iconBg: "bg-amber-50",
      rowBg: "",
    };
  }

  return {
    icon: Send,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    rowBg: "",
  };
}

function splitActivityText(item: ActivityItem) {
  let title = "Actividad";
  let description = item.text;

  if (item.status === "invite_sent") {
    title = "Invitación Enviada";
    description = item.text;
  }

  if (item.status === "slot_booked") {
    title = "Cita Rescatada";
    description = item.text;
  }

  if (item.status === "booking_missed") {
    title = "Hueco sin Cubrir";
    description = item.text;
  }

  return { title, description };
}

function parseBookedDescription(text: string) {
  const prefix = " ha reservado el hueco para ";
  const prefixIndex = text.indexOf(prefix);

  if (prefixIndex === -1) {
    return {
      customerName: "",
      restText: text,
      serviceName: "",
    };
  }

  const customerName = text.slice(0, prefixIndex).trim();
  const serviceName = text.slice(prefixIndex + prefix.length).trim();

  return {
    customerName,
    restText: "ha reservado el hueco para",
    serviceName,
  };
}

function renderDescription(item: ActivityItem) {
  if (item.status === "slot_booked") {
    const parsed = parseBookedDescription(item.text);

    return (
      <p className="pr-2 text-[13px] leading-6 text-slate-500">
        {parsed.customerName ? (
          <>
            <span className="font-medium text-primary">{parsed.customerName}</span>{" "}
            <span>{parsed.restText}</span>{" "}
            <span className="font-semibold text-slate-800">{parsed.serviceName}</span>
          </>
        ) : (
          item.text
        )}
      </p>
    );
  }

  return (
    <p className="pr-2 text-[13px] leading-6 text-slate-500">
      {item.text}
    </p>
  );
}

export function SlotsActivityFeedCard({
  locationId,
}: {
  locationId?: string | null;
}) {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (!locationId) {
      return;
    }

    fetch(`/api/slots/activity?locationId=${locationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setItems(data.items);
        }
      });
  }, [locationId]);

  const recoveredToday = useMemo(() => {
    return getRecoveredToday(items);
  }, [items]);

  return (
    <StandardCard className="overflow-hidden rounded-2xl border border-border/60 bg-white p-0 shadow-sm">
      <div className="px-5 pb-3 pt-5">
        <div className="mb-1 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
            Actividad en Vivo
          </h3>
        </div>

        <p className="text-sm text-slate-500">
          Hoy has recuperado{" "}
          <span className="font-semibold text-emerald-500">
            {recoveredToday}
          </span>{" "}
          citas
        </p>
      </div>

      <ScrollArea className="h-[430px]">
        <div className="px-5 pb-5">
          <div className="relative">
            <div className="absolute bottom-3 left-[16px] top-3 w-px bg-slate-200" />

            <div className="space-y-1.5">
              {items.map((item, index) => {
                const visual = getItemVisual(item.status);
                const Icon = visual.icon;
                const content = splitActivityText(item);

                let rowClassName =
                  "relative flex items-start gap-4 rounded-2xl px-3 py-3 transition-colors";

                if (visual.rowBg !== "") {
                  rowClassName = `relative flex items-start gap-4 rounded-2xl px-3 py-3 transition-colors ${visual.rowBg}`;
                }

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.2 }}
                    className={rowClassName}
                  >
                    <div
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-blue-300 ${visual.iconBg}`}
                    >
                      <Icon className={`h-4 w-4 ${visual.iconColor}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 flex items-baseline justify-between gap-3">
                        <p className="text-[15px] font-semibold leading-tight text-slate-800">
                          {content.title}
                        </p>

                        <span className="shrink-0 text-[13px] font-medium tabular-nums text-slate-500">
                          {new Date(item.time).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {renderDescription(item)}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </StandardCard>
  );
}