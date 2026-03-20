// app/components/slots/SlotsStatsCard.tsx

import { slotStatsMock } from "./slots.mock";
import { RefreshCw, Send, TrendingUp } from "lucide-react";

const ICONS: Record<string, any> = {
  recovered: RefreshCw,
  messages: Send,
  "response-rate": TrendingUp,
};

export function SlotsStatsCard() {
  return (
    <div className="flex items-center gap-6">
      {slotStatsMock.map((stat) => {
        const Icon = ICONS[stat.id];

        return (
          <div
            key={stat.id}
            className="flex items-center gap-3 min-w-0"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
              {Icon && <Icon className="h-4 w-4 text-foreground" />}
            </div>

            <div className="flex flex-col leading-tight">
              <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                {stat.label}
              </span>

              <div className="flex items-baseline gap-1">
                <span className="text-base font-semibold text-foreground tabular-nums">
                  {stat.value}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {stat.sub}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}