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
    <div className="flex items-center gap-3">
      <div className="flex h-10 overflow-hidden rounded-2xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onToday}
          className="h-8 rounded-xl px-4 text-sm font-semibold text-slate-900 transition hover:bg-white"
        >
          Hoy
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-600 transition hover:bg-white hover:text-slate-900"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="min-w-0">
        <div className="truncate text-lg font-bold tracking-tight text-slate-950">
          {rangeTitle}
        </div>
      </div>
    </div>
  );
}