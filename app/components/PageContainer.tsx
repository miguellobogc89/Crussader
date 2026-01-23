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
        "flex-1 min-h-[100dvh] overflow-y-auto",
        // sin padding aquí (lo gestiona PageBody)
        "bg-background",
        // gradiente solo en sm+
        "sm:bg-gradient-to-br sm:from-[#e0f7fa] sm:via-white sm:via-40% sm:to-[#fce4ec] sm:to-90%",
        "sm:bg-fixed",
        className
      )}
    >
      {children}
    </div>
  );
}
