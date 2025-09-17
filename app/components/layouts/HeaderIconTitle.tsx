"use client";

import type { ComponentType, SVGProps } from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  /** overrides opcionales */
  iconClassName?: string;
  titleClassName?: string;
  className?: string;
};

export default function HeaderIconTitle({
  icon: Icon,
  title,
  iconClassName,
  titleClassName,
  className,
}: Props) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Igual que en Company: icono simple, sin wrappers ni fondos */}
      <Icon className={cn("h-6 w-6 text-gray-600", iconClassName)} />
      <h1 className={cn("text-3xl font-extrabold tracking-tight", titleClassName)}>
        {title}
      </h1>
    </div>
  );
}
