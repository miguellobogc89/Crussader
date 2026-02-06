"use client";

import { Button } from "@/app/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { View } from "@/app/components/calendar/calendar/types";;

export default function ViewControls({
  view,
  monthTitle,
  onPrev,
  onNext,
  onToday,
  onChangeView,
}: {
  view: View;
  monthTitle: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onChangeView: (v: View) => void;
}) {
  return (
    <div className="px-3 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPrev}><ChevronLeft className="h-4 w-4" /></Button>
        <Button variant="outline" onClick={onToday}>Hoy</Button>
        <Button variant="outline" size="icon" onClick={onNext}><ChevronRight className="h-4 w-4" /></Button>
        <div className="ml-3 text-sm font-medium capitalize">{monthTitle}</div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant={view === "day" ? "default" : "outline"} onClick={() => onChangeView("day")}>Día</Button>
        <Button variant={view === "week" ? "default" : "outline"} onClick={() => onChangeView("week")}>Semana</Button>
        <Button variant={view === "month" ? "default" : "outline"} onClick={() => onChangeView("month")}>Mes</Button>
      </div>
    </div>
  );
}
