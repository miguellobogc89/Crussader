// app/components/reviews/settings/sections/LanguageSection.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Languages } from "lucide-react";
import type { ResponseSettings } from "@/app/schemas/response-settings";

export function LanguageSection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  return (
    <section id="language">
      <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            Idioma
          </CardTitle>
          <CardDescription>Configuración de idiomas para las respuestas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Idioma por defecto</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => onUpdate({ language: value as "es" | "pt" | "en" })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">🇪🇸 Español</SelectItem>
                  <SelectItem value="pt">🇵🇹 Português</SelectItem>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Autodetectar idioma</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={settings.autoDetectLanguage}
                  onCheckedChange={(checked) => onUpdate({ autoDetectLanguage: checked })}
                />
                <span className="text-sm text-muted-foreground">Responder en el idioma de la reseña</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
