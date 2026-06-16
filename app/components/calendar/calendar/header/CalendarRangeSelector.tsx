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
    <div className="flex min-w-0 items-center gap-2 2xl:gap-3">
      <div className="flex h-8 shrink-0 overflow-hidden rounded-xl bg-slate-100 p-1 2xl:h-10 2xl:rounded-2xl">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-900 2xl:h-8 2xl:w-8 2xl:rounded-xl"
        >
          <ChevronLeft className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
        </button>

        <button
          type="button"
          onClick={onToday}
          className="h-6 rounded-lg px-2 text-xs font-semibold text-slate-900 transition hover:bg-white 2xl:h-8 2xl:rounded-xl 2xl:px-4 2xl:text-sm"
        >
          Hoy
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white hover:text-slate-900 2xl:h-8 2xl:w-8 2xl:rounded-xl"
        >
          <ChevronRight className="h-3.5 w-3.5 2xl:h-4 2xl:w-4" />
        </button>
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-bold tracking-tight text-slate-950 2xl:text-lg">
          {rangeTitle}
        </div>
      </div>
    </div>
  );
}