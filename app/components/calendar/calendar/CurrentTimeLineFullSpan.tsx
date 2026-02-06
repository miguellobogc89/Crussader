// app/components/calendar/calendar/CurrentTimeLineFullSpan.tsx
"use client";

import React, { useEffect, useState } from "react";
import { minutesInTZ, localKeyTZ } from "./tz";

type Props = {
  referenceDate: Date;
  START_HOUR: number;
  HOURS_COUNT: number;
  ROW_PX: number;
  HOURS_COL_PX?: number;
  GAP_PX?: number;
  HEADER_OFFSET_PX?: number;
};

export default function CurrentTimeLineFullSpan({
  referenceDate,
  START_HOUR,
  HOURS_COUNT,
  ROW_PX,
  HOURS_COL_PX = 64,
  GAP_PX = 8,
  HEADER_OFFSET_PX = 0,
}: Props) {
  // ✅ Evita mismatch: SSR + primera hidratación => null
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    const id = setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const isToday = localKeyTZ(referenceDate) === localKeyTZ(now);
  if (!isToday) return null;

  const nowMin = minutesInTZ(now);
  const hour = nowMin / 60;
  const endHour = START_HOUR + HOURS_COUNT;
  if (hour < START_HOUR || hour > endHour) return null;

  const offsetY = HEADER_OFFSET_PX + (hour - START_HOUR) * ROW_PX;
  const left = HOURS_COL_PX + GAP_PX;

  return (
    <div
      className="pointer-events-none absolute inset-x-0"
      style={{ top: `${offsetY}px` }}
    >
      <div
        className="h-[2px]"
        style={{
          marginLeft: left,
          background:
            "linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(168,85,247,1) 100%)",
          boxShadow: "0 0 6px rgba(99,102,241,0.35)",
        }}
        aria-hidden
      />
    </div>
  );
}
