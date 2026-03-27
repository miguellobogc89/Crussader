// app/components/slots/SlotsActivityFeedCard.tsx
"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import StandardCard from "@/app/components/crussader/UX/standardCard";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
  type ActivityItem,
  getActivityDescription,
  getActivityTitle,
  getItemVisual,
  getRecoveredToday,
} from "@/app/components/slots/helpers/slotsActivityFeedHelpers";
import { useSlotsActivity } from "@/hooks/slots/useSlotsActivity";



export function SlotsActivityFeedCard({
  locationId,
}: {
  locationId?: string | null;
}) {

  const { items, loading, error } = useSlotsActivity(locationId);



  const recoveredToday = getRecoveredToday(items);

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


{error && <p className="px-5 text-sm text-red-500">{error}</p>}

      <ScrollArea className="h-[430px]">
        <div className="px-5 pb-5">
          <div className="relative">
            <div className="absolute bottom-3 left-[16px] top-3 w-px bg-slate-200" />

            <div className="space-y-1.5">
              {items.map((item, index) => {
                const visual = getItemVisual(item.status);
                const Icon = visual.icon;
                const title = getActivityTitle(item);

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
                          {title}
                        </p>

                        <span className="shrink-0 text-[13px] font-medium tabular-nums text-slate-500">
                          {new Date(item.time).toLocaleTimeString("es-ES", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="pr-2 text-[13px] leading-6 text-slate-500">
                        {getActivityDescription(item)}
                      </p>
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