// app/components/reviews/settings/sections/PublishingSection.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { UserCheck } from "lucide-react";
import type { ResponseSettings } from "@/app/types/response-settings";
import { SegmentedControl } from "@/app/components/ui/segmented-control";

export function PublishingSection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  return (
    <section id="publishing">
      <Card className="border-none shadow-elegant bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Publicación y control
          </CardTitle>
          <CardDescription>Cómo y cuándo se publican las respuestas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Modo de publicación</Label>
            <SegmentedControl
              options={[
                { value: "draft", label: "Borrador" },
                { value: "auto", label: "Auto-publicar" },
              ]}
              value={settings.publishMode}
              onChange={(value) => onUpdate({ publishMode: value as "draft" | "auto" })}
            />
          </div>

          {settings.publishMode === "auto" && (
            <div className="space-y-2">
              <Label>Umbral auto-publicación</Label>
              <Select
                value={settings.autoPublishThreshold}
                onValueChange={(value) => onUpdate({ autoPublishThreshold: value as any })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3stars">≥3★</SelectItem>
                  <SelectItem value="4stars">≥4★</SelectItem>
                  <SelectItem value="5stars">≥5★</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Variantes a generar</Label>
              <Select
                value={settings.variantsToGenerate.toString()}
                onValueChange={(value) => onUpdate({ variantsToGenerate: parseInt(value) })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 variante</SelectItem>
                  <SelectItem value="2">2 variantes</SelectItem>
                  <SelectItem value="3">3 variantes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Selección</Label>
              <Select
                value={settings.selectionMode}
                onValueChange={(value) => onUpdate({ selectionMode: value as "auto" | "manual" })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automática (mejor de N)</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
