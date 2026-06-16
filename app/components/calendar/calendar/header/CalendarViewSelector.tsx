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
      <div className="hidden h-8 items-center rounded-xl bg-slate-100 p-1 xl:flex xl2:h-9 xl2:rounded-xl2">
        {OPTIONS.map((option) => {
          const isActive = view === option.key;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChangeView(option.key)}
              className={[
                "h-6 rounded-lg px-2 text-[11px] font-semibold transition xl2:h-7 xl2:rounded-xl xl2:px-3 xl2:text-xs",
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
          className="flex h-8 items-center gap-1.5 rounded-xl bg-slate-100 px-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 xl2:h-10 xl2:gap-2 xl2:rounded-xl2 xl2:px-3 xl2:text-sm"
        >
          <CalendarDays className="h-3.5 w-3.5 text-slate-500 xl2:h-4 xl2:w-4" />
          <span>{selected.label}</span>
          <ChevronDown
            className={[
              "ml-1 h-3.5 w-3.5 text-slate-500 transition-transform xl2:ml-2 xl2:h-4 xl2:w-4",
              open ? "rotate-180" : "rotate-0",
            ].join(" ")}
          />
        </button>

        {open ? (
          <div className="absolute right-0 top-9 z-50 w-36 origin-top-right rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 animate-in fade-in zoom-in-95 duration-150 xl2:top-11 xl2:w-40 xl2:rounded-xl2 xl2:p-1.5">
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
                    "flex w-full items-center rounded-lg px-2 py-1.5 text-left text-xs font-medium transition xl2:rounded-xl xl2:px-3 xl2:py-2 xl2:text-sm",
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