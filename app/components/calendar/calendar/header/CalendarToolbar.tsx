// app/components/calendar/calendar/header/CalendarToolbar.tsx
"use client";

import CalendarRangeSelector from "./CalendarRangeSelector";
import CalendarViewSelector, {
  CalendarToolbarView,
} from "./CalendarViewSelector";
import { Plus, Clock3, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/app/components/ui/button";

type Props = {
  view: CalendarToolbarView;
  rangeTitle: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onChangeView: (view: CalendarToolbarView) => void;
  onCreateAppointment?: () => void;
  visibleStartHour: number;
  visibleEndHour: number;
  onChangeVisibleHours: (startHour: number, endHour: number) => void;
};

export default function CalendarToolbar({
  view,
  rangeTitle,
  onPrev,
  onNext,
  onToday,
  onChangeView,
  onCreateAppointment,
  visibleStartHour,
  visibleEndHour,
  onChangeVisibleHours,
}: Props) {
  return (
    <div className="flex min-h-[72px] flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-white px-4 py-3">
      <CalendarRangeSelector
        rangeTitle={rangeTitle}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
      />

      <div className="flex items-center gap-3">
        <div className="flex h-9 items-center gap-2 rounded-2xl bg-slate-100 px-3">
          <Clock3 className="h-4 w-4 text-slate-500" />

          <select
            value={visibleStartHour}
            onChange={(e) =>
              onChangeVisibleHours(Number(e.target.value), visibleEndHour)
            }
            className="bg-transparent text-sm font-semibold text-slate-600 outline-none"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>

          <span className="text-slate-400">-</span>

          <select
            value={visibleEndHour}
            onChange={(e) =>
              onChangeVisibleHours(visibleStartHour, Number(e.target.value))
            }
            className="bg-transparent text-sm font-semibold text-slate-600 outline-none"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>

        <CalendarViewSelector view={view} onChangeView={onChangeView} />

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
        >
          <Search className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition hover:bg-slate-100"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>

        <Button
          type="button"
          onClick={onCreateAppointment}
          className="h-10 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)] transition-all hover:shadow-[0_12px_28px_rgba(37,99,235,0.38)]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva cita
        </Button>
      </div>
    </div>
  );
}