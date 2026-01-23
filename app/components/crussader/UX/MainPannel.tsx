// app/components/crussader/UX/MainPannel.tsx
"use client";

import * as React from "react";

type MainPannelProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export default function MainPannel({
  children,
  className,
  contentClassName,
}: MainPannelProps) {
  return (
<section
  className={[
    // Fondo base
    "bg-white",

    // 🔹 MÓVIL: lienzo blanco total (no panel)
    "rounded-none border-0 shadow-none",

    // 🔹 DESKTOP: panel premium
    "sm:rounded-2xl",
    "sm:border sm:border-slate-200/70",
    "sm:shadow-[0_22px_60px_rgba(37,99,235,0.16)]",

    // comportamiento
    "overflow-hidden",

    // animación
    "animate-in fade-in slide-in-from-bottom-2 duration-300",

    className ?? "",
  ].join(" ")}
>

      <div className={[contentClassName ?? ""].join(" ")}>
        {children}
      </div>
    </section>
  );
}
