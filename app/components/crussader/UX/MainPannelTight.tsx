// app/components/crussader/UX/MainPannelTight.tsx
"use client";

import * as React from "react";

type MainPannelTightProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function MainPannelTight({
  children,
  className,
  contentClassName,
}: MainPannelTightProps) {
  return (
    <div className="-mx-4 -my-4 sm:mx-0 sm:my-0 h-full min-h-0">
      <section
        className={[
          "bg-white",
          "w-full",
          "sm:mx-auto",
          "xl2:max-w-[70vw]",
          "rounded-none border-0 shadow-none",
          "sm:rounded-2xl",
          "sm:border sm:border-slate-200/70",
          "sm:shadow-[0_22px_60px_rgba(37,99,235,0.16)]",
          "h-full min-h-0 overflow-hidden flex flex-col",
          "animate-in fade-in slide-in-from-bottom-2 duration-300",
          className ?? "",
        ].join(" ")}
      >
        <div
          className={[
            "h-full min-h-0 overflow-hidden",
            "p-4 sm:p-5", // ✅ padding real del panel
            contentClassName ?? "",
          ].join(" ")}
        >
          {children}
        </div>
      </section>
    </div>
  );
}