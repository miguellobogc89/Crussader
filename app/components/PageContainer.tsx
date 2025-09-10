// app/components/PageContainer.tsx
"use client";
import { cn } from "@/lib/utils";

export default function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        // sin margen en eje X, full width
        "w-full h-full bg-white overflow-y-auto",
        className
      )}
    >
      {children}
    </div>
  );
}
