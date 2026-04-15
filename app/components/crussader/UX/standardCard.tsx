// app/components/crussader/UX/standardCard.tsx
"use client";

import * as React from "react";

type StandardCardProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  header?: React.ReactNode;
  headerClassName?: string;
  bodyClassName?: string;
  scrollBody?: boolean;
};

export default function StandardCard({
  children,
  className,
  contentClassName,
  header,
  headerClassName,
  bodyClassName,
  scrollBody = false,
}: StandardCardProps) {
  return (
    <section
      className={[
        "flex h-full min-h-0 max-h-full flex-col",
        "bg-white text-card-foreground",
        "rounded-xl border border-slate-300",
        "overflow-hidden",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        className ?? "",
      ].join(" ")}
    >
      {header ? (
        <div
          className={[
            "shrink-0 border-b border-slate-200",
            "h-12 md:h-16 xl:h-20 xl2:h-22",
            "px-6 md:px-4 xl:px-4 xl2:px-5",
            "flex items-center",
            headerClassName ?? "",
          ].join(" ")}
        >
          {header}
        </div>
      ) : null}

      <div
        className={[
          "flex min-h-0 flex-1 max-h-full flex-col",
          scrollBody ? "overflow-y-auto overflow-x-hidden" : "overflow-hidden",
          contentClassName ?? "",
          bodyClassName ?? "",
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}