// app/components/reviews/settings/sections/PoliciesSection.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ChipInput } from "@/app/components/ui/chip-input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Separator } from "@/app/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Info, User } from "lucide-react";
import type { ResponseSettings } from "@/app/types/response-settings";

export function PoliciesSection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  return (
    <section id="policies">
      <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Políticas y guardarraíles
          </CardTitle>
          <CardDescription>Protección y cumplimiento normativo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Frases prohibidas</Label>
            <ChipInput
              value={settings.bannedPhrases}
              onChange={(phrases) => onUpdate({ bannedPhrases: phrases })}
              placeholder="Añadir frase prohibida..."
            />
            <p className="text-xs text-muted-foreground">La IA evitará usar estas frases en las respuestas</p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.noPublicCompensation}
                onCheckedChange={(checked) => onUpdate({ noPublicCompensation: checked })}
              />
              <Label>No prometer compensaciones públicas</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.avoidPersonalData}
                onCheckedChange={(checked) => onUpdate({ avoidPersonalData: checked })}
              />
              <Label>Evitar solicitar datos personales (RGPD)</Label>
              <Tooltip>
                <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent><p>Cumplimiento del Reglamento General de Protección de Datos</p></TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
