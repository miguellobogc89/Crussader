// app/components/shift-calendar/calendar/PaintableCell.tsx
"use client";

import type * as React from "react";

export type Handlers = {
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerEnter: () => void;
  onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void;
};

export default function PaintableCell({
  date,
  dayKey,
  inMonth,
  getCellHandlers,
  children,
}: {
  date: Date;
  dayKey: string;
  inMonth: boolean;

  getCellHandlers: (args: { date: Date; dayKey: string; inMonth: boolean }) => Handlers;

  children: (handlers: Handlers) => React.ReactNode;
}) {
  const handlers = getCellHandlers({ date, dayKey, inMonth });
  return <>{children(handlers)}</>;
}
