"use client";

import type { Iconish } from "./types";

export function SidebarIcon({
  icon,
  className = "h-4 w-4 xl2:h-5 xl2:w-5",
}: {
  icon: Iconish;
  className?: string;
}) {
  if (typeof icon === "string") {
    return (
      <span className="text-sm xl2:text-base leading-none">
        {icon}
      </span>
    );
  }

  const Icon = icon;
  return <Icon className={className} />;
}