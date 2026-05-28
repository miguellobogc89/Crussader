"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  value: number;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onChange: (value: number) => void;
};

export default function HourDropdown({
  value,
  open,
  onOpen,
  onClose,
  onChange,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const label = `${String(value).padStart(2, "0")}:00`;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current) {
        return;
      }

      if (rootRef.current.contains(event.target as Node)) {
        return;
      }

      onClose();
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          if (open) {
            onClose();
            return;
          }

          onOpen();
        }}
        className="flex h-8 items-center gap-1 bg-transparent text-sm font-semibold text-slate-600 outline-none"
      >
        <span>{label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {open ? (
        <div className="absolute left-0 top-9 z-50 max-h-64 w-28 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10 animate-in fade-in zoom-in-95 duration-150 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300">
          {Array.from({ length: 24 }, (_, hour) => {
            const isActive = hour === value;

            return (
              <button
                key={hour}
                type="button"
                onClick={() => {
                  onChange(hour);
                  onClose();
                }}
                className={[
                  "flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium transition",
                  isActive
                    ? "bg-slate-100 text-slate-950"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                ].join(" ")}
              >
                {String(hour).padStart(2, "0")}:00
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}