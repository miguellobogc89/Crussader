// app/components/crussader/UX/Spinner.tsx
"use client";

import { Leapfrog } from "ldrs/react";
import "ldrs/react/Leapfrog.css";

type Props = {
  /** Tamaño en píxeles (default: 40) */
  size?: number | string;
  /** Velocidad del ciclo (default: 2.5) */
  speed?: number | string;
  /** Color del spinner (default: #6366f1 → indigo-500) */
  color?: string;
  /** Si se pasa true, centra el spinner automáticamente */
  centered?: boolean;
};

export default function Spinner({
  size = 40,
  speed = 2.5,
  color = "#6366f1",
  centered = false,
}: Props) {
  const wrapperClass = centered
    ? "flex items-center justify-center w-full h-full"
    : "";

  return (
    <div className={wrapperClass}>
      <Leapfrog size={String(size)} speed={String(speed)} color={color} />
    </div>
  );
}
