// app/components/calendar/calendar/header/CalendarToolbar.tsx
"use client";

import { useState } from "react";
import CalendarRangeSelector from "./CalendarRangeSelector";
import CalendarViewSelector, {
  CalendarToolbarView,
} from "./CalendarViewSelector";
import HourDropdown from "./HourDropdown";
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
  const [openHourDropdown, setOpenHourDropdown] = useState<
    "start" | "end" | null
  >(null);

  return (
    <div className="flex min-h-[48px] items-center justify-between gap-2 bg-white px-2 py-1.5 xl2:min-h-[64px] xl2:gap-3 xl2:px-4 xl2:py-3">
      <div className="min-w-0 flex-1 overflow-visible">
        <CalendarRangeSelector
          rangeTitle={rangeTitle}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
        />
      </div>

      <div className="flex shrink-0 items-center gap-1.5 xl2:gap-3">
        <div className="flex h-7 items-center gap-1 rounded-lg bg-slate-100 px-1.5 xl2:h-9 xl2:gap-2 xl2:rounded-xl xl2:px-3">
          <Clock3 className="h-3 w-3 text-slate-500 xl2:h-4 xl2:w-4" />

          <HourDropdown
            value={visibleStartHour}
            open={openHourDropdown === "start"}
            onOpen={() => setOpenHourDropdown("start")}
            onClose={() => setOpenHourDropdown(null)}
            onChange={(hour) => {
              onChangeVisibleHours(hour, visibleEndHour);
            }}
          />

          <span className="text-[11px] text-slate-400 xl2:text-sm">-</span>

          <HourDropdown
            value={visibleEndHour}
            open={openHourDropdown === "end"}
            onOpen={() => setOpenHourDropdown("end")}
            onClose={() => setOpenHourDropdown(null)}
            onChange={(hour) => {
              onChangeVisibleHours(visibleStartHour, hour);
            }}
          />
        </div>

        <CalendarViewSelector view={view} onChangeView={onChangeView} />

        <Button
          type="button"
          onClick={onCreateAppointment}
          className="h-7 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-2 text-[11px] font-semibold text-white shadow-[0_6px_14px_rgba(37,99,235,0.20)] transition-all hover:shadow-[0_8px_18px_rgba(37,99,235,0.28)] xl2:h-9 xl2:rounded-xl xl2:px-4 xl2:text-sm"
        >
          <Plus className="mr-1 h-3 w-3 xl2:mr-2 xl2:h-4 xl2:w-4" />
          Nueva cita
        </Button>
      </div>
    </div>
  );
}