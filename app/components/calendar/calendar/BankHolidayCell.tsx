// app/components/calendar/calendar/BankHolidayCell.tsx
"use client";

export default function BankHolidayCell({
  visible,
  title,
}: {
  visible: boolean;
  title?: string;
}) {
  if (!visible) return null;

  return (
    <span
      className="h-2 w-2 rounded-full bg-amber-400"
      title={title}
      aria-label={title || "Festivo"}
    />
  );
}
