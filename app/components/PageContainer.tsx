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
        "transition-all duration-300 ease-in-out px-50",
        "flex-1 min-h-[100dvh] overflow-y-auto",
        "bg-gradient-to-br from-[#e0f7fa] via-white via-40% to-[#fce4ec] to-90%",
        "bg-fixed", // 👈 fondo fijo
        className
      )}
    >
      {children}
    </div>
  );
}
