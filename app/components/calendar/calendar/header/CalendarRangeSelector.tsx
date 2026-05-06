// app/components/calendar/calendar/header/CalendarRangeSelector.tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";

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
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={onPrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button variant="outline" onClick={onToday}>
        Hoy
      </Button>

      <Button variant="outline" size="icon" onClick={onNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>

      <div className="ml-3 text-base font-semibold text-slate-900 capitalize">
        {rangeTitle}
      </div>
    </div>
  );
}