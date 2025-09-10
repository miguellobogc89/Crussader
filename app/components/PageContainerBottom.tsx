"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Contenedor inferior con ancho máximo 1600px y
 * fondo gradiente diagonal (top-right → bottom-left).
 */
export default function PageBottom({
  children,
  className,
  padded = true,
  // gradiente diagonal con colores en HEX
  bgClass = "bg-gradient-to-bl from-[#eaf3ff] to-[#ffffff]",
  withTopBorder = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  bgClass?: string;
  withTopBorder?: boolean;
}) {
  return (
    <div
      className={cn(
        withTopBorder && "border-t border-black/5",
        bgClass,
        className
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-[1600px]",
          padded && "px-4 sm:px-6 lg:px-8"
        )}
      >
        <section className="py-6">{children}</section>
      </div>
    </div>
  );
}
