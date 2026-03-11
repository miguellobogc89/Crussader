"use client";

import { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  className?: string;
}>;

export default function ScrollBar({ children, className = "" }: Props) {
  return (
    <div
      className={[
        "overflow-auto",
        "scrollbar-thin",
        "scrollbar-thumb-muted-foreground/30",
        "scrollbar-track-transparent",
        "hover:scrollbar-thumb-muted-foreground/50",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
