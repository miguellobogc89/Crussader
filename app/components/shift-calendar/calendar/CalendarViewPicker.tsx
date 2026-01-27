// app/components/shift-calendar/calendar/CalendarViewPicker.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

export type CalendarViewMode = "1d" | "3d" | "1w" | "ww" | "1m" | "3m" | "1y";

export default function CalendarViewPicker({
  value,
  onChange,
}: {
  value: CalendarViewMode;
  onChange: (m: CalendarViewMode) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as CalendarViewMode)}>
      <SelectTrigger className="h-9 w-[170px] rounded-xl border-slate-200 bg-white text-sm">
        <SelectValue placeholder="Vista" />
      </SelectTrigger>

      <SelectContent className="rounded-xl">
        <SelectItem value="1d">1 día</SelectItem>
        <SelectItem value="3d">3 días</SelectItem>
        <SelectItem value="ww">Semana laboral</SelectItem>
        <SelectItem value="1w">1 semana</SelectItem>
        <SelectItem value="1m">1 mes</SelectItem>
        <SelectItem value="3m">3 meses</SelectItem>
        <SelectItem value="1y">Todo el año</SelectItem>
      </SelectContent>
    </Select>
  );
}
