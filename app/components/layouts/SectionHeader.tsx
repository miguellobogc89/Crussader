"use client";

import type { ComponentType, SVGProps } from "react";
import { useId } from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  iconClassName?: string;
  titleClassName?: string;
  className?: string;
  gradientFrom?: string;
  gradientTo?: string;
};

export default function SectionHeader({
  icon: Icon,
  title,
  iconClassName,
  titleClassName,
  className,
  gradientFrom = "#4f46e5", // indigo-600
  gradientTo = "#a855f7",   // purple-600
}: Props) {
  const gradId = `hdr-grad-${useId().replace(/[:]/g, "")}`;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Icono renderizado como SVG con gradiente de trazo */}
      <svg
        className={cn("h-7 w-7", iconClassName)}
        viewBox="0 0 24 24"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
        <Icon />
      </svg>

      {/* Título */}
      <h1
        className={cn(
          "text-3xl md:text-4xl font-extrabold tracking-tight",
          titleClassName
        )}
      >
        {title}
      </h1>
    </div>
  );
}
