// app/components/crussader/ColorBubblePicker.tsx
"use client";

import { useState } from "react";

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#db2777",
  "#64748b",
];

type Props = {
  value: string;
  onChange: (color: string) => void;
};

export default function ColorBubblePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-[38px] w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3"
      >
        <span className="text-sm text-slate-600">Color</span>

        <span
          className="h-5 w-5 rounded-full border border-slate-200"
          style={{ backgroundColor: value }}
        />
      </button>

      {open && (
        <div className="absolute bottom-11 right-0 z-[120] grid w-36 grid-cols-4 gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                onChange(color);
                setOpen(false);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200"
              style={{ backgroundColor: color }}
            >
              {value === color && (
                <span className="h-2 w-2 rounded-full bg-white" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}