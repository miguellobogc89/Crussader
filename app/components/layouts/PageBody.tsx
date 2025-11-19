"use client";

import { ReactNode } from "react";

export default function PageBody({
  toolbar,
  children,
  variant = "default",
}: {
  toolbar?: ReactNode;
  children: ReactNode;
  variant?: "default" | "full" | "narrow";
}) {
  const width =
    variant === "full"
      ? "max-w-none w-full"
      : variant === "narrow"
      ? "max-w-2xl"
      : "max-w-7xl";

  return (
    <main
      role="main"
      className={`w-full bg-dark ${width} mx-auto px-4 py-6 sm:px-6 lg:px-8`}
    >
      {toolbar && <div className="mb-4">{toolbar}</div>}
      {children}
    </main>
  );
}
