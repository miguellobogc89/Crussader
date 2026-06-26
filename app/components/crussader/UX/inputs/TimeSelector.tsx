// app/components/crussader/UX/inputs/TimeSelector.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";

type TimeSelectorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  startHour?: number;
  endHour?: number;
};

function padTime(value: number) {
  return String(value).padStart(2, "0");
}

function normalizeTime(value: string) {
  const cleanedValue = value.replace(/[^\d:]/g, "");

  if (!cleanedValue) {
    return "";
  }

  if (/^\d{1,2}$/.test(cleanedValue)) {
    return cleanedValue;
  }

  if (/^\d{1,2}:\d{0,2}$/.test(cleanedValue)) {
    return cleanedValue;
  }

  return cleanedValue.slice(0, 5);
}

function isValidTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [hour, minute] = value.split(":").map(Number);

  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function buildHours(startHour: number, endHour: number) {
  const hours: string[] = [];

  for (let hour = startHour; hour <= endHour; hour += 1) {
    hours.push(padTime(hour));
  }

  return hours;
}

const MINUTES = ["00", "15", "30", "45"];

export function TimeSelector({
  value,
  onChange,
  placeholder = "Seleccionar hora",
  disabled = false,
  startHour = 7,
  endHour = 22,
}: TimeSelectorProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [draftValue, setDraftValue] = useState(value);

  const hours = useMemo(() => {
    return buildHours(startHour, endHour);
  }, [startHour, endHour]);

  const selectedHour = value.split(":")[0] ?? "";
  const selectedMinute = value.split(":")[1] ?? "";

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

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

  function commitManualValue(nextValue: string) {
    if (!isValidTime(nextValue)) {
      setDraftValue(value);
      return;
    }

    onChange(nextValue);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextValue = normalizeTime(event.target.value);

    setDraftValue(nextValue);

    if (isValidTime(nextValue)) {
      onChange(nextValue);
    }
  }

  function handleInputBlur() {
    commitManualValue(draftValue);
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      commitManualValue(draftValue);
      setOpen(false);
      inputRef.current?.blur();
    }

    if (event.key === "Escape") {
      setDraftValue(value);
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  function selectHour(hour: string) {
    const nextMinute = selectedMinute || "00";
    const nextValue = `${hour}:${nextMinute}`;

    setDraftValue(nextValue);
    onChange(nextValue);
  }

  function selectMinute(minute: string) {
    const nextHour = selectedHour || padTime(startHour);
    const nextValue = `${nextHour}:${minute}`;

    setDraftValue(nextValue);
    onChange(nextValue);
    setOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className="
          flex h-11 w-full items-center gap-2 rounded-xl
          border border-[#E5E7EB] bg-white px-3 text-sm
          shadow-sm transition
          focus-within:ring-2 focus-within:ring-primary/30
        "
      >
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          value={draftValue}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="
            h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none
            placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60
          "
        />
      </div>

      <div
        className={`
          absolute left-0 top-full z-50 mt-1 w-full
          rounded-xl border border-[#E5E7EB] bg-white p-2 shadow-lg
          transition-all duration-150 ease-out
          ${
            open
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
          }
        `}
      >
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="mb-1 px-2 text-xs font-medium text-slate-400">
              Hora
            </div>

            <div className="h-40 space-y-1 overflow-y-auto pr-1">
              {hours.map((hour) => {
                const isSelected = hour === selectedHour;

                return (
                  <button
                    key={hour}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectHour(hour)}
                    className={`
                      h-9 w-full rounded-lg px-3 text-left text-sm transition
                      ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    {hour}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-1 px-2 text-xs font-medium text-slate-400">
              Minutos
            </div>

            <div className="flex h-40 flex-col justify-between">
              {MINUTES.map((minute) => {
                const isSelected = minute === selectedMinute;

                return (
                  <button
                    key={minute}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectMinute(minute)}
                    className={`
                      h-9 w-full rounded-lg px-3 text-left text-sm transition
                      ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "text-slate-700 hover:bg-slate-50"
                      }
                    `}
                  >
                    {minute}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}