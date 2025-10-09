"use client";

export default function WeekDaysHeader({
  days,
  isToday,
  fmtLabel,
}: {
  days: Date[];
  isToday: (d: Date) => boolean;
  fmtLabel: (d: Date) => string;
}) {
  return (
    <div className="px-3 pb-3">
      <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] gap-2">
        <div />
        {days.map((d) => (
          <div
            key={d.toISOString()}
            className={`h-10 flex items-center justify-center rounded-md text-xs font-medium ${
              isToday(d) ? "bg-primary/10 text-primary" : "text-muted-foreground"
            }`}
            title={fmtLabel(d)}
          >
            {fmtLabel(d)}
          </div>
        ))}
      </div>
    </div>
  );
}
