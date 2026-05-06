// app/components/calendar/calendar/header/CalendarToolbar.tsx
"use client";

import CalendarRangeSelector from "./CalendarRangeSelector";
import CalendarViewSelector, {
  CalendarToolbarView,
} from "./CalendarViewSelector";
import { Plus, Clock3 } from "lucide-react";
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
    <div className="flex flex-wrap items-center justify-between gap-3">
      <CalendarRangeSelector
        rangeTitle={rangeTitle}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
      />

      <div className="flex items-center gap-3">
<div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
  <Clock3 className="h-4 w-4 text-slate-500" />

  <select
    value={visibleStartHour}
    onChange={(e) =>
      onChangeVisibleHours(
        Number(e.target.value),
        visibleEndHour
      )
    }
    className="bg-transparent text-sm font-medium text-slate-700 outline-none"
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
      onChangeVisibleHours(
        visibleStartHour,
        Number(e.target.value)
      )
    }
    className="bg-transparent text-sm font-medium text-slate-700 outline-none"
  >
    {Array.from({ length: 24 }, (_, h) => (
      <option key={h} value={h}>
        {String(h).padStart(2, "0")}:00
      </option>
    ))}
  </select>
</div>
        <CalendarViewSelector view={view} onChangeView={onChangeView} />

        <Button
          type="button"
          onClick={onCreateAppointment}
          className="rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] px-4 text-sm font-medium text-white shadow-[0_8px_20px_rgba(37,99,235,0.35)] transition-all hover:shadow-[0_10px_24px_rgba(37,99,235,0.45)]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva cita
        </Button>
      </div>
    </div>
  );
}