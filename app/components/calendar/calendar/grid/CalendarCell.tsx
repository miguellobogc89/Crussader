// app/components/calendar/calendar/Grid/CalendarCell.tsx
"use client";

type Props = {
  cellId: string;
  isSelected?: boolean;
  rowPx: number;
  onClick?: (cellId: string) => void;
  onDoubleClick?: (cellId: string) => void;
};

export default function CalendarCell({
  cellId,
  isSelected = false,
  rowPx,
  onClick,
  onDoubleClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(cellId)}
      onDoubleClick={() => onDoubleClick?.(cellId)}
      className={[
        "block w-full bg-transparent text-left",
        "transition-colors hover:bg-slate-50/70",
        isSelected ? "bg-blue-50 ring-1 ring-inset ring-blue-300" : "",
      ].join(" ")}
      style={{ height: `${rowPx}px` }}
    />
  );
}