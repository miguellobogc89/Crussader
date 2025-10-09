"use client";

export default function HourGuides({
  count,
  rowPx,
  headerOffset = 0,
}: {
  count: number;
  rowPx: number;
  headerOffset?: number;
}) {
  const hoursTop = Array.from({ length: count + 1 }, (_, i) => headerOffset + i * rowPx);
  const halves = Array.from({ length: count }, (_, i) => headerOffset + i * rowPx + rowPx / 2);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {hoursTop.map((t, i) => (
        <div key={`h${i}`} className="absolute left-0 right-0 border-t border-dashed border-border/60" style={{ top: `${t}px` }} />
      ))}
      {halves.map((t, i) => (
        <div key={`m${i}`} className="absolute left-0 right-0 border-t border-dashed border-border/40" style={{ top: `${t}px` }} />
      ))}
    </div>
  );
}
