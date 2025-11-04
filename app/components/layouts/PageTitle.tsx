// app/components/layouts/PageTitle.tsx
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
  iconName?: LucideIconName;
  className?: string;
  gradient?: string;
  size?: "md" | "lg";
}) {
  // mismo mapping original
  const iconBox =
    size === "md" ? "h-10 w-10 rounded-xl" : "h-8 w-8 rounded-lg";
  const iconSize = size === "md" ? "h-6 w-6" : "h-5 w-5";
  const titleSize = size === "md" ? "text-2xl" : "text-xl";

  // misma lógica dinámica original
  const Icon: ComponentType<{ className?: string }> | undefined =
    iconName && Icons[iconName as LucideIconName]
      ? (Icons[iconName as LucideIconName] as any)
      : undefined;

  return (
    <div className={`flex items-start justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={`shrink-0 grid place-items-center text-white shadow-lg bg-gradient-to-r ${gradient} ${iconBox}`}
            aria-hidden="true"
          >
            <Icon className={iconSize} />
          </div>
        )}

        <div className="min-w-0">
          <h1 className={`font-bold text-foreground ${titleSize} leading-tight`}>
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
