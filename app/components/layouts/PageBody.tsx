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
      ? "w-full max-w-none"
      : variant === "narrow"
        ? "max-w-2xl"
        : "max-w-7xl";

  return (
    <main
      role="main"
      className={[
        "flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden",
        "mx-auto",
        widthClasses,
        "px-4 py-4 sm:px-6 sm:py-6 lg:py-8 xl:px-8 xl2:px-8",
      ].join(" ")}
    >
      {toolbar ? <div className="mb-4 shrink-0">{toolbar}</div> : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </main>
  );
}