"use client";

import type { ResponseSettings } from "@/app/schemas/response-settings";
import { PreviewStickyCard } from "@/app/components/reviews/settings/PreviewStickyCard";

export default function ResponsePreview({
  settings,
  selectedStar,
  onStarChange,
  className = "",
}: {
  settings: ResponseSettings;
  selectedStar: 1 | 3 | 5;
  onStarChange: (s: 1 | 3 | 5) => void;
  className?: string;
}) {
  return (
    <section id="preview" className={`mb-8 ${className}`}>
      <h2 className="text-lg font-semibold mb-3">Vista previa de respuesta</h2>
      <PreviewStickyCard
        settings={settings}
        selectedStar={selectedStar}
        onStarChange={onStarChange}
      />
    </section>
  );
}
