"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MaxW =
  | "max-w-3xl"
  | "max-w-4xl"
  | "max-w-5xl"
  | "max-w-6xl"
  | "max-w-7xl"
  | "max-w-none";

/**
 * Contenedor superior: título, breadcrumbs, tabs, KPIs…
 * Igual que el “top” del PageContainer.
 */
export default function PageTop({
  children,
  className,
  maxW = "max-w-6xl",
  padded = true,
  bgClass = "bg-white",
  withBottomDivider = true,
}: {
  children: ReactNode;
  className?: string;
  maxW?: MaxW;
  padded?: boolean;
  /** fondo del wrapper superior */
  bgClass?: string;
  /** muestra separador suave debajo */
  withBottomDivider?: boolean;
}) {
  return (
    <div className={cn("w-full", bgClass, className)}>
      <div className={cn("mx-auto", maxW, padded && "px-4 sm:px-6 lg:px-8")}>
        <section className="pt-6 pb-4">{children}</section>
      </div>

      {withBottomDivider && (
        <hr className="my-2 h-px border-0 bg-gradient-to-r from-purple-500/30 via-purple-500/10 to-sky-500/30 rounded" />
      )}
    </div>
  );
}
