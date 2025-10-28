"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import type { ResponseSettings } from "@/app/schemas/response-settings";

export function LanguageSection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Idioma por defecto */}
        <div className="space-y-2">
          <Label>Idioma por defecto</Label>
          <Select
            value={settings.language}
            onValueChange={(value) => onUpdate({ language: value as "es" | "pt" | "en" })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona idioma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">🇪🇸 Español</SelectItem>
              <SelectItem value="pt">🇵🇹 Português</SelectItem>
              <SelectItem value="en">🇺🇸 English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Autodetección */}
        <div className="space-y-2">
          <Label>Autodetectar idioma</Label>
          <div className="flex items-center gap-3">
            <Switch
              checked={settings.autoDetectLanguage}
              onCheckedChange={(checked) => onUpdate({ autoDetectLanguage: checked })}
            />
            <span className="text-sm text-muted-foreground">
              Responder en el idioma de la reseña automáticamente
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
