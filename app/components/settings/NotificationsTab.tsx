// app/components/settings/NotificationsTab.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Switch } from "@/app/components/ui/switch";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Bell, Mail, Smartphone, Star, AlertCircle } from "lucide-react";

export default function NotificationsTab() {
  const [whenNotify, setWhenNotify] = useState("bad-reviews");
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [frequency, setFrequency] = useState("instant");
  const [onlyPendingResponse, setOnlyPendingResponse] = useState(false);

  // Si más adelante quieres coordinar con un footer global de "Guardar cambios":
  const [modified, setModified] = useState(false);
  const handleChange = () => setModified(true);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight mb-2">Notificaciones</h2>
        <p className="text-muted-foreground text-sm">
          Configura cuándo y cómo quieres recibir notificaciones sobre nuevas reseñas.
        </p>
      </div>

      {/* Cuándo notificar */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Cuándo notificar</span>
          </CardTitle>
          <CardDescription>Elige qué tipo de reseñas quieres que generen notificaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={whenNotify}
            onValueChange={(value) => {
              setWhenNotify(value);
              handleChange();
            }}
          >
            <div className="flex items-start space-x-3 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="always" id="always" className="mt-1" />
              <div className="space-y-2">
                <Label htmlFor="always" className="font-medium cursor-pointer">
                  Siempre
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recibir notificación por cada nueva reseña, sin importar las estrellas
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="bad-reviews" id="bad-reviews" className="mt-1" />
              <div className="space-y-2">
                <Label htmlFor="bad-reviews" className="font-medium cursor-pointer flex items-center space-x-2">
                  <span>Solo por malas reseñas (≤ 2★)</span>
                  <Badge variant="secondary">Recomendado</Badge>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Solo notificar cuando recibas reseñas de 1 o 2 estrellas que requieren atención inmediata
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="never" id="never" className="mt-1" />
              <div className="space-y-2">
                <Label htmlFor="never" className="font-medium cursor-pointer">
                  Nunca
                </Label>
                <p className="text-sm text-muted-foreground">
                  No recibir notificaciones automáticas. Solo ver las reseñas al entrar al dashboard
                </p>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Canal de notificaciones */}
      {whenNotify !== "never" && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Canal de notificaciones</CardTitle>
            <CardDescription>Selecciona por dónde quieres recibir las notificaciones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">maria@heladeribrumazul.com</p>
                </div>
              </div>
              <Switch
                checked={emailEnabled}
                onCheckedChange={(checked) => {
                  setEmailEnabled(checked);
                  handleChange();
                }}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl border">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="font-medium">Notificaciones en la app</Label>
                  <p className="text-sm text-muted-foreground">Notificaciones push en el navegador</p>
                </div>
              </div>
              <Switch
                checked={inAppEnabled}
                onCheckedChange={(checked) => {
                  setInAppEnabled(checked);
                  handleChange();
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frecuencia */}
      {whenNotify !== "never" && (emailEnabled || inAppEnabled) && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Frecuencia</CardTitle>
            <CardDescription>¿Con qué frecuencia quieres recibir las notificaciones?</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={frequency}
              onValueChange={(value) => {
                setFrequency(value);
                handleChange();
              }}
            >
              <div className="flex items-start space-x-3 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="instant" id="instant" className="mt-1" />
                <div className="space-y-2">
                  <Label htmlFor="instant" className="font-medium cursor-pointer">
                    Instantáneo
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir notificación inmediatamente cuando llegue una nueva reseña
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="daily" id="daily" className="mt-1" />
                <div className="space-y-2">
                  <Label htmlFor="daily" className="font-medium cursor-pointer">
                    Resumen diario
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Un email al final del día con todas las reseñas recibidas (si las hay)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="weekly" id="weekly" className="mt-1" />
                <div className="space-y-2">
                  <Label htmlFor="weekly" className="font-medium cursor-pointer">
                    Resumen semanal
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Un email los lunes con el resumen de la semana anterior
                  </p>
                </div>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {/* Filtros adicionales */}
      {whenNotify !== "never" && (emailEnabled || inAppEnabled) && (
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Filtros adicionales</CardTitle>
            <CardDescription>Opciones avanzadas para afinar las notificaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-xl border">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="font-medium">Solo si hay respuesta pendiente</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar únicamente las reseñas que aún no han sido respondidas
                  </p>
                </div>
              </div>
              <Switch
                checked={onlyPendingResponse}
                onCheckedChange={(checked) => {
                  setOnlyPendingResponse(checked);
                  handleChange();
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview de notificación */}
      {whenNotify !== "never" && (emailEnabled || inAppEnabled) && (
        <Card className="rounded-2xl shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Mail className="h-5 w-5" />
              <span>Vista previa de notificación</span>
            </CardTitle>
            <CardDescription>Así se vería una notificación con tu configuración actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 p-4 rounded-xl bg-white dark:bg-gray-900 border shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <Star className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">Nueva reseña: 2★</h4>
                    <p className="text-xs text-muted-foreground">Heladería Brumazul</p>
                  </div>
                </div>
                <Badge variant="destructive" className="text-xs">
                  Requiere atención
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground">
                "El servicio fue muy lento y los helados no tenían buen sabor. No volveré."
              </p>

              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>hace 2 minutos</span>
                <Button size="sm" variant="outline" className="h-7">
                  Ver respuesta sugerida
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
