// app/components/slots/AvailableSlotsListHeader.tsx
"use client";

import { Clock3, WalletCards } from "lucide-react";
import { formatEuro } from "../helpers/slotsWeeklyCalendarItemHelpers";

type Props = {
  pendingPublishCount: number;
  pendingAmount: number;
};

export function AvailableSlotsListHeader({
  pendingPublishCount,
  pendingAmount,
}: Props) {
  return (
    <div className="flex w-full items-start justify-between gap-3 xl2:gap-4">
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[13px] font-semibold text-foreground xl:text-sm xl2:text-[15px]">
          Huecos creados
        </h2>

        <p className="mt-1 text-[11px] text-muted-foreground xl:text-xs xl2:text-[13px]">
          Gestiona los huecos liberados.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 xl:gap-2">
        <div className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-[11px] font-medium text-orange-700 xl:px-2.5 xl:py-1 xl:text-xs">
          <Clock3 className="h-3 w-3 xl:h-3.5 xl:w-3.5" />
          <span className="font-semibold tabular-nums">
            {pendingPublishCount}
          </span>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 xl:px-2.5 xl:py-1 xl:text-xs">
          <WalletCards className="h-3 w-3 xl:h-3.5 xl:w-3.5" />
          <span className="font-semibold tabular-nums">
            {formatEuro(pendingAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}