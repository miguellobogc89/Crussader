// app/components/reviews/settings/sections/ChannelsCtaSection.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { Info, Globe } from "lucide-react";
import type { ResponseSettings } from "@/app/types/response-settings";
import { SegmentedControl } from "@/app/components/ui/segmented-control";

export function ChannelsCtaSection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  return (
    <section id="channels">
      <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Canales y CTA
          </CardTitle>
          <CardDescription>Configura llamadas a la acción y canales preferidos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Canal preferido</Label>
              <Select
                value={settings.preferredChannel}
                onValueChange={(value) => onUpdate({ preferredChannel: value as any })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                  <SelectItem value="phone">📞 Teléfono</SelectItem>
                  <SelectItem value="email">📧 Email</SelectItem>
                  <SelectItem value="web">🌐 Web</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cuándo mostrar CTA</Label>
              <SegmentedControl
                options={[
                  { value: "always", label: "Siempre" },
                  { value: "below3", label: "<3★" },
                  { value: "above4", label: "≥4★" },
                  { value: "never", label: "Nunca" },
                ]}
                value={settings.showCTAWhen}
                onChange={(value) => onUpdate({ showCTAWhen: value as any })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ctaText">Texto de CTA</Label>
            <Textarea
              id="ctaText"
              value={settings.ctaText}
              onChange={(e) => onUpdate({ ctaText: e.target.value })}
              placeholder="ej. ¡Nos vemos pronto!"
              rows={2}
            />
            <div className="text-xs text-muted-foreground">{settings.ctaText.length}/100 caracteres</div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch checked={settings.addUTM} onCheckedChange={(checked) => onUpdate({ addUTM: checked })} />
            <Label>Añadir parámetros UTM a enlaces</Label>
            <Tooltip>
              <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
              <TooltipContent><p>Para rastrear el origen del tráfico en Analytics</p></TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
