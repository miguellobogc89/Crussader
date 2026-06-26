// app/components/crussader/UX/inputs/DatePicker.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateLabel(value: string) {
  if (!value) return "";

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getMonthDays(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startOffset = (firstDay.getDay() + 6) % 7;
  const days: Array<Date | null> = [];

  for (let index = 0; index < startOffset; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  return days;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  disabled = false,
}: DatePickerProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => {
    if (!value) return null;

    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }, [value]);

  const [visibleMonth, setVisibleMonth] = useState<Date>(() => {
    return selectedDate ?? new Date();
  });

  useEffect(() => {
    if (selectedDate) {
      setVisibleMonth(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const days = getMonthDays(visibleMonth);

  const monthLabel = new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(visibleMonth);

  function goToPreviousMonth() {
    setVisibleMonth(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setVisibleMonth(
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1)
    );
  }

  function selectDate(date: Date) {
    onChange(toDateInputValue(date));
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className="
          flex h-11 w-full items-center gap-2 rounded-xl
          border border-[#E5E7EB] bg-white px-3 text-sm
          shadow-sm transition
          hover:bg-white
          focus:outline-none focus:ring-2 focus:ring-primary/30
          disabled:cursor-not-allowed disabled:opacity-60
        "
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />

        <span
          className={
            value
              ? "truncate text-slate-900"
              : "truncate text-muted-foreground"
          }
        >
          {value ? formatDateLabel(value) : placeholder}
        </span>
      </button>

      <div
        className={`
          absolute left-0 top-full z-50 mt-1 w-full
          rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-lg
          transition-all duration-150 ease-out
          ${
            open
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
          }
        `}
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={goToPreviousMonth}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="text-sm font-medium capitalize text-slate-900">
            {monthLabel}
          </div>

          <button
            type="button"
            onClick={goToNextMonth}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-400">
          {["L", "M", "X", "J", "V", "S", "D"].map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} />;
            }

            const dateValue = toDateInputValue(date);
            const isSelected = dateValue === value;
            const isToday = dateValue === toDateInputValue(new Date());

            return (
              <button
                key={dateValue}
                type="button"
                onClick={() => selectDate(date)}
                className={`
                  h-9 rounded-lg text-sm transition
                  ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-700 hover:bg-slate-50"
                  }
                  ${
                    isToday && !isSelected
                      ? "font-semibold text-primary"
                      : ""
                  }
                `}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}