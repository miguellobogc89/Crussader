"use client";

import * as React from "react";

type Props = {
  /** Tamaño en px (default: 24) */
  size?: number;
  /** Grosor del borde (default: 2) */
  stroke?: number;
  /** Color Tailwind o hex (default: slate-400) */
  colorClassName?: string;
  /** Centrar automáticamente */
  centered?: boolean;
  className?: string;
};

export default function SpinnerCircle({
  size = 24,
  stroke = 2,
  colorClassName = "text-slate-400",
  centered = false,
  className,
}: Props) {
  const spinner = (
    <svg
      className={[
        "animate-spin",
        colorClassName,
        className ?? "",
      ].join(" ")}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r={12 - stroke}
        stroke="currentColor"
        strokeWidth={stroke}
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="
          M12 2
          a10 10 0 0 1 10 10
          h-3
          a7 7 0 0 0 -7 -7
          z
        "
      />
    </svg>
  );

  if (!centered) return spinner;

  return (
    <div className="flex items-center justify-center w-full h-full">
      {spinner}
    </div>
  );
}
