// app/components/calendar/calendar/CalendarToolbar.tsx
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";

type View = "day" | "threeDays" | "workingWeek" | "week" | "month";

const VIEW_LABEL: Record<View, string> = {
  day: "Día",
  threeDays: "3 días",
  workingWeek: "Laboral",
  week: "Semana",
  month: "Mes",
};

export default function CalendarToolbar({
  view,
  monthTitle,
  selectedDate,
  onPrev,
  onNext,
  onToday,
  onChangeView,
  onJumpToMonth,
}: {
  view: View;
  monthTitle: string;
  selectedDate: Date;

  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;

  onChangeView: (v: View) => void;
  onJumpToMonth: (year: number, monthIndex: number) => void;
}) {
  const [monthOpen, setMonthOpen] = useState(false);

  const monthOptions = useMemo(() => {
    const fmt = new Intl.DateTimeFormat("es-ES", { month: "long" });
    return Array.from({ length: 12 }, (_, i) => {
      const label = fmt.format(new Date(2026, i, 1));
      const pretty = label.charAt(0).toUpperCase() + label.slice(1);
      return { value: String(i), label: pretty };
    });
  }, []);

  const yearOptions = useMemo(() => {
    const y = selectedDate.getFullYear();
    const from = y - 5;
    const to = y + 5;

    const out: Array<{ value: string; label: string }> = [];
    for (let yy = from; yy <= to; yy++) {
      out.push({ value: String(yy), label: String(yy) });
    }
    return out;
  }, [selectedDate]);

  const [tmpMonth, setTmpMonth] = useState(String(selectedDate.getMonth()));
  const [tmpYear, setTmpYear] = useState(String(selectedDate.getFullYear()));

  React.useEffect(() => {
    setTmpMonth(String(selectedDate.getMonth()));
    setTmpYear(String(selectedDate.getFullYear()));
  }, [selectedDate]);

  function applyMonthJump() {
    const y = Number(tmpYear);
    const m = Number(tmpMonth);
    if (!Number.isFinite(y)) return;
    if (!Number.isFinite(m)) return;

    onJumpToMonth(y, m);
    setMonthOpen(false);
  }

  return (
    <div className="cal-header sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-border">
      <div className="px-3 py-3 flex items-center justify-between gap-3">
        {/* left: nav + month */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center rounded-xl border border-border bg-white overflow-hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onPrev}
              className="h-9 w-9 rounded-none hover:bg-slate-50"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="w-px bg-border" />

            <Button
              type="button"
              variant="ghost"
              onClick={onToday}
              className="h-9 rounded-none px-3 text-sm font-medium hover:bg-slate-50"
            >
              Hoy
            </Button>

            <div className="w-px bg-border" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onNext}
              className="h-9 w-9 rounded-none hover:bg-slate-50"
              aria-label="Siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Popover open={monthOpen} onOpenChange={setMonthOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-xl px-3 text-sm font-semibold capitalize text-slate-900 hover:bg-slate-50"
              >
                <span className="truncate max-w-[220px]">{monthTitle}</span>
                <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
              </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-[280px] p-3">
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Ir a…
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-slate-700">Mes</div>
                    <Select value={tmpMonth} onValueChange={setTmpMonth}>
                      <SelectTrigger className="h-9 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xs font-medium text-slate-700">Año</div>
                    <Select value={tmpYear} onValueChange={setTmpYear}>
                      <SelectTrigger className="h-9 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {yearOptions.map((y) => (
                          <SelectItem key={y.value} value={y.value}>
                            {y.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 rounded-xl"
                    onClick={() => setMonthOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    className="h-9 rounded-xl"
                    onClick={applyMonthJump}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* right: view */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Vista</span>
          </div>

          <Select value={view} onValueChange={(v) => onChangeView(v as View)}>
            <SelectTrigger className="h-9 w-[160px] rounded-xl bg-white">
              <SelectValue placeholder="Vista" />
            </SelectTrigger>

            <SelectContent align="end">
              <SelectItem value="day">{VIEW_LABEL.day}</SelectItem>
              <SelectItem value="threeDays">{VIEW_LABEL.threeDays}</SelectItem>
              <SelectItem value="workingWeek">{VIEW_LABEL.workingWeek}</SelectItem>
              <SelectItem value="week">{VIEW_LABEL.week}</SelectItem>
              <SelectItem value="month">{VIEW_LABEL.month}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
