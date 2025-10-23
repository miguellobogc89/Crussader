"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import { Sparkles } from "lucide-react";
import type { ResponseSettings } from "@/app/schemas/response-settings";
import AnimatedSlider from "@/app/components/crussader/UX/controls/AnimatedSlider";

type Bucket = "1-2" | "3" | "4-5";

/** Longitud: 0 Breve, 1 Media, 2 Detallada → límite por bucket */
function computeAutoLimit(bucket: Bucket, lengthIndex: number): number {
  const tables: Record<Bucket, number[]> = {
    "1-2": [220, 320, 420],
    "3": [160, 220, 300],
    "4-5": [120, 180, 240],
  };
  const row = tables[bucket] ?? tables["3"];
  const idx = Math.min(Math.max(lengthIndex, 0), 2);
  return row[idx];
}

export function StarRulesSection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  const [activeTab, setActiveTab] = useState<Bucket>("1-2");

  const lengthOptions = useMemo(
    () => [
      { value: 0, label: "Breve", emoji: "📝" },
      { value: 1, label: "Media", emoji: "📄" },
      { value: 2, label: "Detallada", emoji: "📚" },
    ],
    []
  );

  const activeConfig = settings.starSettings[activeTab];
  const autoLimit = useMemo(
    () => computeAutoLimit(activeTab, activeConfig.length),
    [activeTab, activeConfig.length]
  );

  return (
    <section id="stars">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Reglas por estrellas
          </CardTitle>
          <CardDescription>
            Personaliza el enfoque según la puntuación recibida
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as Bucket)}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid w-full grid-cols-3 sm:w-[320px]">
                <TabsTrigger value="1-2">1–2★</TabsTrigger>
                <TabsTrigger value="3">3★</TabsTrigger>
                <TabsTrigger value="4-5">4–5★</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Objetivo principal */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Objetivo principal</span>
              <Select
                value={activeConfig.objective}
                onValueChange={(value) =>
                  onUpdate({
                    starSettings: {
                      ...settings.starSettings,
                      [activeTab]: { ...activeConfig, objective: value as any },
                    },
                  })
                }
              >
                <SelectTrigger className="w-[240px]">
                  <SelectValue placeholder="Selecciona objetivo" />
                </SelectTrigger>
                <SelectContent>
                  {activeTab === "1-2" && (
                    <SelectItem value="apology">🙇 Disculpa / solución</SelectItem>
                  )}
                  {activeTab === "3" && (
                    <SelectItem value="neutral">🧭 Neutral / explicación</SelectItem>
                  )}
                  {activeTab === "4-5" && (
                    <SelectItem value="thanks">🎁 Agradecimiento / fidelización</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Longitud del mensaje */}
          <div className="flex flex-col gap-8">
            <div>
              <AnimatedSlider
                id="length-slider"
                value={activeConfig.length}
                options={lengthOptions}
                onChange={(lengthVal) => {
                  const newLimit = computeAutoLimit(activeTab, lengthVal);
                  onUpdate({
                    starSettings: {
                      ...settings.starSettings,
                      [activeTab]: { ...activeConfig, length: lengthVal },
                    },
                    maxCharacters: newLimit,
                  });
                }}
                gradientFromTo="from-purple-400 to-pink-400"
                thicknessPx={12}
                widthPercent={100}
                showLabels={true}
                emphasizeSelected={true}
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Máx. caracteres:&nbsp;
                <span className="font-medium">{autoLimit}</span>
              </div>

              {/* CTA Toggle */}
              <div className="flex items-center gap-3">
                <Label htmlFor="enable-cta" className="text-sm text-muted-foreground">
                  Incluir CTA en este caso
                </Label>
                <Switch
                  id="enable-cta"
                  checked={activeConfig.enableCTA}
                  onCheckedChange={(checked) =>
                    onUpdate({
                      starSettings: {
                        ...settings.starSettings,
                        [activeTab]: { ...activeConfig, enableCTA: checked },
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
