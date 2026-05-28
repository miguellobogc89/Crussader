// app/components/slots/SlotSkeleton.tsx
"use client";

export function SlotSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border/60 bg-white p-3 xl:p-3.5">
      <div className="mb-2.5 h-3.5 w-1/3 rounded bg-[#e5e7eb]" />
      <div className="mb-2 h-3 w-2/3 rounded bg-[#e5e7eb]" />
      <div className="h-3 w-1/2 rounded bg-[#e5e7eb]" />
    </div>
  );
}