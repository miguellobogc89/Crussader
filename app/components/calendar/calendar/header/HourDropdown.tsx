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
        className="flex h-6 items-center gap-1 bg-transparent text-xs font-semibold text-slate-600 outline-none xl2:h-8 xl2:text-sm"
      >
        <span>{label}</span>
        <ChevronDown className="h-3 w-3 text-slate-400 xl2:h-3.5 xl2:w-3.5" />
      </button>

      {open ? (
        <div className="absolute left-0 top-8 z-50 max-h-64 w-24 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl shadow-slate-900/10 animate-in fade-in zoom-in-95 duration-150 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 xl2:top-9 xl2:w-28 xl2:rounded-xl2 xl2:p-1.5">
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
                  "flex w-full items-center rounded-lg px-2 py-1.5 text-left text-xs font-medium transition xl2:rounded-xl xl2:px-3 xl2:py-2 xl2:text-sm",
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