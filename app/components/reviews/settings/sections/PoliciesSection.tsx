"use client";

import { ChipInput } from "@/app/components/ui/chip-input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Separator } from "@/app/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Info } from "lucide-react";
import type { ResponseSettings } from "@/app/schemas/response-settings";

export function PoliciesSection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  return (
    <>
      {/* Frases prohibidas */}
      <div className="space-y-2">
        <Label>Frases prohibidas</Label>
        <ChipInput
          value={settings.bannedPhrases}
          onChange={(phrases) => onUpdate({ bannedPhrases: phrases })}
          placeholder="Añadir frase prohibida..."
        />
        <p className="text-xs text-muted-foreground">
          La IA evitará usar estas frases en las respuestas
        </p>
      </div>

      <Separator className="my-4" />

      {/* Switches de política */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch
            checked={settings.noPublicCompensation}
            onCheckedChange={(checked) => onUpdate({ noPublicCompensation: checked })}
          />
          <Label>No prometer compensaciones públicas</Label>
        </div>

        <div className="flex items-center gap-3">
          <Switch
            checked={settings.avoidPersonalData}
            onCheckedChange={(checked) => onUpdate({ avoidPersonalData: checked })}
          />
          <Label className="flex items-center gap-2">
            Evitar solicitar datos personales (RGPD)
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Cumplimiento del Reglamento General de Protección de Datos</p>
              </TooltipContent>
            </Tooltip>
          </Label>
        </div>
      </div>
    </>
  );
}
