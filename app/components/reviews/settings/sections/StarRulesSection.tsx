// app/components/reviews/settings/sections/StarRulesSection.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Sparkles } from "lucide-react";
import type { ResponseSettings } from "@/app/types/response-settings";
import { GradualSlider } from "@/app/components/ui/gradual-slider";

export function StarRulesSection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  const lengthOptions = [
    { value: 0, label: "Breve", emoji: "📝" },
    { value: 1, label: "Media", emoji: "📄" },
    { value: 2, label: "Detallada", emoji: "📚" },
  ];

  return (
    <section id="stars">
      <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Reglas por estrellas
          </CardTitle>
          <CardDescription>Personaliza el enfoque según la puntuación recibida</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="1-2" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1-2">1–2★</TabsTrigger>
              <TabsTrigger value="3">3★</TabsTrigger>
              <TabsTrigger value="4-5">4–5★</TabsTrigger>
            </TabsList>

            {Object.entries(settings.starSettings).map(([key, config]) => (
              <TabsContent key={key} value={key} className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Objetivo principal</Label>
                    <Select
                      value={config.objective}
                      onValueChange={(value) =>
                        onUpdate({
                          starSettings: {
                            ...settings.starSettings,
                            [key]: { ...config, objective: value as any },
                          },
                        })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {key === "1-2" && <SelectItem value="apology">🙇 Disculpa/solución</SelectItem>}
                        {key === "3" && <SelectItem value="neutral">🧭 Neutral/explicación</SelectItem>}
                        {key === "4-5" && <SelectItem value="thanks">🎁 Agradecimiento/fidelización</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Longitud de respuesta</Label>
                    <GradualSlider
                      value={config.length}
                      onChange={(value) =>
                        onUpdate({
                          starSettings: {
                            ...settings.starSettings,
                            [key]: { ...config, length: value },
                          },
                        })
                      }
                      options={lengthOptions}
                      gradient="from-purple-400 to-pink-400"
                    />
                    <div className="flex items-center justify-between text-sm">
                      <Label htmlFor={`limit-${key}`}>Límite duro (caracteres)</Label>
                      <Input
                        id={`limit-${key}`}
                        type="number"
                        value={settings.maxCharacters}
                        onChange={(e) => onUpdate({ maxCharacters: parseInt(e.target.value) })}
                        className="w-20 h-8"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.enableCTA}
                      onCheckedChange={(checked) =>
                        onUpdate({
                          starSettings: {
                            ...settings.starSettings,
                            [key]: { ...config, enableCTA: checked },
                          },
                        })
                      }
                    />
                    <Label>Incluir CTA público</Label>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
