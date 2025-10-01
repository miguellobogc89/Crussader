// app/components/PageContainer.tsx

"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/app/components/ui/sidebar";

export default function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-in-out",
        "flex-1 h-screen overflow-y-auto",   // ✅ usamos flex-1 en lugar de w-full
        className
      )}
    >
      {children}
    </div>
  );
}
