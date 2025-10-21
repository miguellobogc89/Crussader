"use client";

import * as Icons from "lucide-react";
import { ComponentType } from "react";

type LucideIconName = keyof typeof Icons;

export default function PageTitle({
  title,
  subtitle,
  iconName,
  className = "",
  gradient = "from-indigo-600 via-violet-600 to-fuchsia-600",
  size = "lg",
}: {
  title: string;
  subtitle?: string;
  iconName?: LucideIconName; // 👈 solo pasas el nombre del icono
  className?: string;
  gradient?: string;
  size?: "md" | "lg";
}) {
  const iconBox =
    size === "lg"
      ? "h-10 w-10 rounded-xl"
      : "h-8 w-8 rounded-lg";
  const iconSize = size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const titleSize = size === "lg" ? "text-2xl" : "text-xl";

  // Buscar icono dinámicamente
  const Icon: ComponentType<{ className?: string }> | undefined =
    iconName && Icons[iconName as LucideIconName]
      ? (Icons[iconName as LucideIconName] as any)
      : undefined;

  return (
    <div className={["flex items-start justify-between gap-3", className].join(" ")}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <div
            className={[
              "shrink-0 grid place-items-center text-white shadow-sm",
              "bg-gradient-to-r",
              iconBox,
              gradient,
            ].join(" ")}
            aria-hidden="true"
          >
            <Icon className={iconSize} />
          </div>
        ) : null}

        <div className="min-w-0">
          <h1 className={["font-bold text-foreground", titleSize, "leading-tight"].join(" ")}>
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
