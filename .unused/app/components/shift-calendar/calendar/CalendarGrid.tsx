// app/components/shift-calendar/calendar/CalendarGrid.tsx
"use client";

export default function CalendarGrid({
  days,
  renderCell,
}: {
  days: Date[];
  renderCell: (d: Date) => React.ReactNode;
}) {
  return <div className="grid grid-cols-7">{days.map((d) => renderCell(d))}</div>;
}
