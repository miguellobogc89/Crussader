// app/hooks/useSectionLoading.tsx
"use client";

import { useState } from "react";
import Spinner from "@/app/components/crussader/UX/Spinner";

export function useSectionLoading(initial = false) {
  const [loading, setLoading] = useState(initial);

  const SectionWrapper = ({
    children,
    topPadding = "pt-6 sm:pt-10",
  }: {
    children: React.ReactNode;
    topPadding?: string;
  }) => {
    if (loading) {
      return (
        <div className={`w-full ${topPadding}`}>
          <div className="flex w-full justify-center py-10">
            {/* 👉 Spinner estándar Crussader */}
            <Spinner centered size={48} color="#6366f1" />
          </div>
        </div>
      );
    }

    return <div className={`w-full ${topPadding}`}>{children}</div>;
  };

  return { loading, setLoading, SectionWrapper };
}
