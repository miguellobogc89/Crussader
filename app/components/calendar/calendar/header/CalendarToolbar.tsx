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
    <div className="flex min-h-[64px] items-center justify-between gap-3 border-b border-slate-100 bg-white px-3 py-2 lg:px-4 lg:py-3">
      <div className="min-w-0 overflow-hidden max-[1100px]:max-w-[150px]">
        <CalendarRangeSelector
          rangeTitle={rangeTitle}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
        />
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-2 lg:gap-3">
        <div className="flex h-8 items-center gap-1.5 rounded-xl bg-slate-100 px-2 lg:h-9 lg:gap-2 lg:px-3">
          <Clock3 className="h-3.5 w-3.5 text-slate-500 lg:h-4 lg:w-4" />

          <HourDropdown
            value={visibleStartHour}
            open={openHourDropdown === "start"}
            onOpen={() => setOpenHourDropdown("start")}
            onClose={() => setOpenHourDropdown(null)}
            onChange={(hour) => {
              onChangeVisibleHours(hour, visibleEndHour);
            }}
          />

          <span className="text-xs text-slate-400 lg:text-sm">-</span>

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
          className="h-8 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-3 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(37,99,235,0.24)] transition-all hover:shadow-[0_10px_22px_rgba(37,99,235,0.32)] lg:h-9 lg:px-4 lg:text-sm"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5 lg:mr-2 lg:h-4 lg:w-4" />
          Nueva cita
        </Button>
      </div>
    </div>
  );
}