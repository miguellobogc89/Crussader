// app/components/calendar/calendar/header/CalendarViewSelector.tsx
"use client";

import { Button } from "@/app/components/ui/button";

export type CalendarToolbarView =
  | "day"
  | "threeDays"
  | "workingWeek"
  | "week"
  | "month";

type Props = {
  view: CalendarToolbarView;
  onChangeView: (view: CalendarToolbarView) => void;
};

const OPTIONS: { key: CalendarToolbarView; label: string }[] = [
  { key: "day", label: "Día" },
  { key: "threeDays", label: "3 días" },
  { key: "workingWeek", label: "Laboral" },
  { key: "week", label: "Semana" },
  { key: "month", label: "Mes" },
];

export default function CalendarViewSelector({
  view,
  onChangeView,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map((option) => (
        <Button
          key={option.key}
          variant={view === option.key ? "default" : "outline"}
          onClick={() => onChangeView(option.key)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}