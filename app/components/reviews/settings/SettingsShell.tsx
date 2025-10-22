"use client";

import type { ResponseSettings } from "@/app/schemas/response-settings";
import { SettingsEditorCard } from "@/app/components/reviews/settings/SettingsEditorCard";
import ResponsePreview from "@/app/components/reviews/settings/ResponsePreview";

export default function SettingsShell({
  settings,
  onUpdate,
  selectedStar,
  onStarChange,
  className = "",
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
  selectedStar: 1 | 3 | 5;
  onStarChange: (s: 1 | 3 | 5) => void;
  className?: string;
}) {
  return (
    <div className={`flex-1 overflow-y-auto px-5 py-6 ${className}`}>
      {/* PREVIEW: ahora vive dentro del shell, arriba del todo */}
      <ResponsePreview
        settings={settings}
        selectedStar={selectedStar}
        onStarChange={onStarChange}
        className="mb-10"
      />

      {/* Admin */}
      <section id="admin" className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Admin</h2>
        <SettingsEditorCard settings={settings} onUpdate={onUpdate} />
      </section>

      {/* General */}
      <section id="general" className="mb-8">
        <h2 className="text-lg font-semibold mb-4">General</h2>
        {/* TODO: componentes específicos de "General" */}
      </section>

      {/* Tono y estilo */}
      <section id="tone" className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Tono y estilo</h2>
        {/* TODO */}
      </section>

      {/* Reglas */}
      <section id="rules" className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Reglas</h2>
        {/* TODO */}
      </section>

      {/* Idioma y canal */}
      <section id="lang" className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Idioma y canal</h2>
        {/* TODO */}
      </section>

      <div className="h-6" />
    </div>
  );
}
