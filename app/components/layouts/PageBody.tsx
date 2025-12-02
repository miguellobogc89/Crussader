// app/components/layouts/PageBody.tsx
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
  const widthClasses =
    variant === "full"
      ? "max-w-none w-full"
      : variant === "narrow"
      ? "max-w-2xl"
      : "max-w-7xl";

  return (
    <main
      role="main"
      className={[
        "w-full mx-auto",
        widthClasses,
        // padding horizontal + vertical responsivo
        "px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8",
      ].join(" ")}
    >
      {toolbar && <div className="mb-4">{toolbar}</div>}
      {children}
    </main>
  );
}
