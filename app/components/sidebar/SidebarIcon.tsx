"use client";

import type { Iconish } from "./types";

export function SidebarIcon({ icon, className = "h-5 w-5" }: { icon: Iconish; className?: string }) {
  if (typeof icon === "string") {
    return <span className="text-base leading-none">{icon}</span>;
  }
  const Icon = icon;
  return <Icon className={className} />;
}
