// app/components/slots/SlotsActivityFeedCard.tsx
"use client";

import { useEffect, useState } from "react";
import StandardCard from "@/app/components/crussader/UX/standardCard";

type ActivityItem = {
  id: string;
  text: string;
  time: string;
  status: string;
};

export function SlotsActivityFeedCard({ locationId }: { locationId?: string | null }) {
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

  return (
    <StandardCard className="p-5">
      <h3 className="text-sm font-semibold text-foreground tracking-tight mb-4">
        Actividad reciente
      </h3>

      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 py-2.5 px-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className="h-7 w-7 rounded-lg bg-primary-muted flex items-center justify-center shrink-0 mt-0.5">
              <div className="h-2 w-2 rounded-full bg-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{item.text}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                {new Date(item.time).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </StandardCard>
  );
}