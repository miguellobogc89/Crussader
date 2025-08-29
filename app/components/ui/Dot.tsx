// app/components/ui/Dot.tsx
import React from "react";

type DotProps = {
  show?: boolean;                           // oculta/muestra sin desmontar
  color?: "emerald" | "red" | "yellow" | "sky" | "violet" | "neutral";
  size?: "xs" | "sm" | "md";
  className?: string;
  title?: string;
};

export default function Dot({
  show = true,
  color = "emerald",
  size = "sm",
  className = "",
  title,
}: DotProps) {
  if (!show) return null;

  const sizeCls = size === "xs" ? "h-1.5 w-1.5" : size === "md" ? "h-2.5 w-2.5" : "h-2 w-2";
  const colorMap = {
    emerald: "bg-emerald-500 ring-emerald-100",
    red: "bg-red-500 ring-red-100",
    yellow: "bg-yellow-400 ring-yellow-100",
    sky: "bg-sky-500 ring-sky-100",
    violet: "bg-violet-500 ring-violet-100",
    neutral: "bg-neutral-400 ring-neutral-200",
  } as const;

  return (
    <span
      title={title}
      className={[
        "inline-block rounded-full ring-2 shadow",
        sizeCls,
        colorMap[color],
        className,
      ].join(" ")}
      aria-hidden
    />
  );
}
