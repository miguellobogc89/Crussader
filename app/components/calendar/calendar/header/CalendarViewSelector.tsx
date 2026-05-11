// app/components/calendar/calendar/header/CalendarViewSelector.tsx
"use client";

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

export default function CalendarViewSelector({ view, onChangeView }: Props) {
  return (
    <div className="flex h-9 items-center rounded-2xl bg-slate-100 p-1">
      {OPTIONS.map((option) => {
        const isActive = view === option.key;

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChangeView(option.key)}
            className={[
              "h-7 rounded-xl px-3 text-xs font-semibold transition",
              isActive
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}