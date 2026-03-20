// app/components/slots/SlotsActivityFeedCard.tsx

import { slotActivitiesMock } from "./slots.mock";
import StandardCard from "@/app/components/crussader/UX/standardCard";

export function SlotsActivityFeedCard() {
  return (
    <StandardCard className="p-5">
      <h3 className="text-sm font-semibold text-foreground tracking-tight mb-4">
        Actividad reciente
      </h3>

      <div className="space-y-1">
        {slotActivitiesMock.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 py-2.5 px-2 rounded-xl hover:bg-muted/50 transition-colors"
          >
            <div className="h-7 w-7 rounded-lg bg-primary-muted flex items-center justify-center shrink-0 mt-0.5">
              <item.icon className={`h-3.5 w-3.5 ${item.colorClass}`} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{item.text}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                {item.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </StandardCard>
  );
}