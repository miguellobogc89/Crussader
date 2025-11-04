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
      className={`w-full bg-dark ${width} mx-auto`}
    >
      {toolbar && <div>{toolbar}</div>}
      {children}
    </main>
  );
}
