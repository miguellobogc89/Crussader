// app/components/PageContainer.tsx
"use client";
import { cn } from "@/lib/utils";

export default function PageContainer({
  children,
  wide = false,        // true = sin max-width (full-bleed)
  noGutter = false,    // true = sin padding exterior
  className,
}: {
  children: React.ReactNode;
  wide?: boolean;
  noGutter?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(noGutter ? "" : "px-6 md:px-9 py-6", className)}>
      <div className={cn(wide ? "max-w-none" : "max-w-7xl", "w-full mx-auto")}>
        {children}
      </div>
    </div>
  );
}
