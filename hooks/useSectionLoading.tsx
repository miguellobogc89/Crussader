// app/hooks/useSectionLoading.tsx
"use client";

import { useState } from "react";

export function useSectionLoading(initial = false) {
  const [loading, setLoading] = useState(initial);

  const SectionWrapper = ({
    children,
    topPadding = "pt-10",
    minH = "min-h-[50vh]",
  }: {
    children: React.ReactNode;
    topPadding?: string;
    minH?: string;
  }) => (
    <div className={`relative ${minH}`}>
      {loading && (
        <div className={`pointer-events-none absolute inset-0 z-10 bg-background/40 backdrop-blur-sm ${topPadding}`}>
          <div className="flex w-full justify-center">
            <div
              role="status"
              aria-label="Cargando"
              className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-muted-foreground/40 border-t-foreground"
            />
          </div>
        </div>
      )}
      <div className={loading ? "blur-[1px]" : ""}>{children}</div>
    </div>
  );

  return { loading, setLoading, SectionWrapper };
}
