"use client";

import { Card, CardContent } from "@/app/components/ui/card";
import { ResponsePreviewPanel } from "@/app/components/reviews/ResponsePreviewPanel";
import type { ResponseSettings } from "@/app/schemas/response-settings";

export function PreviewStickyCard({
  settings,
  selectedStar,
  onStarChange,
}: {
  settings: ResponseSettings;
  selectedStar: 1 | 3 | 5;
  onStarChange: (s: 1 | 3 | 5) => void;
}) {
  return (
    <div className="lg:sticky lg:top-8">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <ResponsePreviewPanel
            settings={settings}
            selectedStar={selectedStar}
            onStarChange={onStarChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
