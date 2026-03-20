// app/components/crussader/UX/standardCard.tsx
"use client";

import * as React from "react";

type StandardCardProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function StandardCard({
  children,
  className,
  contentClassName,
}: StandardCardProps) {
  return (
    <section
      className={[
        "bg-card text-card-foreground",
        "rounded-xl",
        "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(15,23,42,0.06)]",
        "overflow-hidden",
        "animate-in fade-in slide-in-from-bottom-2 duration-300",
        className ?? "",
      ].join(" ")}
    >
      <div className={contentClassName ?? ""}>{children}</div>
    </section>
  );
}