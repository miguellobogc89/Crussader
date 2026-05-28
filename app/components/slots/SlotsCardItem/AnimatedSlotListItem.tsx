// app/components/slots/AnimatedSlotListItem.tsx
"use client";

import type { SlotDTO } from "@/hooks/slots/useSlots";
import type { SelectedServiceItem } from "../slots.types";
import { SlotsListCardItem } from "./SlotsListCardItem";

type Props = {
  slot: SlotDTO;
  isExiting: boolean;
  isEntering: boolean;
  onSlotClick?: (
    day: string,
    slot: SlotDTO,
    services: SelectedServiceItem[],
  ) => void;
};

export function AnimatedSlotListItem({
  slot,
  isExiting,
  isEntering,
  onSlotClick,
}: Props) {
  return (
    <div
      className={[
        "overflow-hidden transition-all duration-300 ease-out",
        isExiting
          ? "max-h-0 -translate-y-1 opacity-0"
          : "max-h-40 translate-y-0 opacity-100",
        isEntering ? "scale-[0.98] opacity-0" : "",
      ].join(" ")}
    >
      <SlotsListCardItem slot={slot} onClick={onSlotClick} />
    </div>
  );
}