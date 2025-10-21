"use client";

import { Card, CardContent } from "@/app/components/ui/card";
import { ResponseSettingsForm } from "@/app/components/reviews/ResponseSettingsForm";
import type { ResponseSettings } from "@/app/schemas/response-settings";

export function SettingsEditorCard({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <ResponseSettingsForm settings={settings} onUpdate={onUpdate} />
      </CardContent>
    </Card>
  );
}
