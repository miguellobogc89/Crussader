// app/components/calendar/calendar/header/CalendarRangeSelector.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  rangeTitle: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

export default function CalendarRangeSelector({
  rangeTitle,
  onPrev,
  onNext,
  onToday,
}: Props) {
  return (
    <div className="flex min-w-0 items-center gap-2 xl2:gap-3">
      <div className="flex h-8 shrink-0 overflow-hidden rounded-xl bg-slate-100 p-1 xl2:h-10 xl2:rounded-xl2">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-900 xl2:h-8 xl2:w-8 xl2:rounded-xl"
        >
          <ChevronLeft className="h-3.5 w-3.5 xl2:h-4 xl2:w-4" />
        </button>

        <button
          type="button"
          onClick={onToday}
          className="h-6 rounded-lg px-2 text-xs font-semibold text-slate-900 transition hover:bg-white xl2:h-8 xl2:rounded-xl xl2:px-4 xl2:text-sm"
        >
          Hoy
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-900 xl2:h-8 xl2:w-8 xl2:rounded-xl"
        >
          <ChevronRight className="h-3.5 w-3.5 xl2:h-4 xl2:w-4" />
        </button>
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-bold tracking-tight text-slate-950 xl2:text-lg">
          {rangeTitle}
        </div>
      </div>
    </div>
  );
}