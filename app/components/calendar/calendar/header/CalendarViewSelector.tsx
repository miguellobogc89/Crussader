// app/components/calendar/calendar/header/CalendarViewSelector.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (!rootRef.current) {
      return;
    }

    if (rootRef.current.contains(event.target as Node)) {
      return;
    }

    setOpen(false);
  }

  if (open) {
    document.addEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [open]);
  const selected = OPTIONS.find((option) => option.key === view) ?? OPTIONS[0];

  return (
    <>
      <div className="hidden h-9 items-center rounded-2xl bg-slate-100 p-1 xl:flex">
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

      <div ref={rootRef} className="relative xl:hidden">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 items-center gap-2 rounded-2xl bg-slate-100 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <CalendarDays className="h-4 w-4 text-slate-500" />
          <span>{selected.label}</span>
          <ChevronDown
            className={[
              "ml-2 h-4 w-4 text-slate-500 transition-transform",
              open ? "rotate-180" : "rotate-0",
            ].join(" ")}
          />
        </button>

        {open ? (
          <div className="absolute right-0 top-11 z-50 w-40 origin-top-right rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 animate-in fade-in zoom-in-95 duration-150">
            {OPTIONS.map((option) => {
              const isActive = option.key === view;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    onChangeView(option.key);
                    setOpen(false);
                  }}
                  className={[
                    "flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium transition",
                    isActive
                      ? "bg-slate-100 text-slate-950"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                  ].join(" ")}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </>
  );
}