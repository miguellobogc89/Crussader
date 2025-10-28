"use client";

import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Switch } from "@/app/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { CheckCircle2, Bell, Mail, MessageCircle, Smartphone, Info } from "lucide-react";
import { SegmentedControl } from "@/app/components/ui/segmented-control";
import type { ResponseSettings } from "@/app/schemas/response-settings";

type Threshold = "5stars" | "4stars" | "3stars";
type NotifyChannel = "email" | "whatsapp" | "sms";

const notificationChannels: Record<
  NotifyChannel,
  { icon: React.ComponentType<{ className?: string }>; label: string; placeholder: string }
> = {
  email: { icon: Mail, label: "Email", placeholder: "usuario@ejemplo.com" },
  whatsapp: { icon: MessageCircle, label: "WhatsApp", placeholder: "+34 612 345 678" },
  sms: { icon: Smartphone, label: "SMS", placeholder: "+34 612 345 678" },
};

export function PublishingSection({
  settings,
  onUpdate,
}: {
  settings: ResponseSettings;
  onUpdate: (updates: Partial<ResponseSettings>) => void;
}) {
  const autoPublishEnabled = settings.publishMode === "auto";

  const currentChannel = settings.notificationChannel;
  const currentContact = settings.notificationContact;

  const isValidChannel = currentChannel in notificationChannels;
  const NotificationIcon = isValidChannel ? notificationChannels[currentChannel].icon : Mail;
  const channelInfo = isValidChannel ? notificationChannels[currentChannel] : notificationChannels.email;

  const threshold = settings.autoPublishThreshold;

  const starRangeOptions = [
    { value: "5stars", label: "Solo 5★" },
    { value: "4stars", label: "4★ y 5★" },
    { value: "3stars", label: "3★, 4★ y 5★" },
  ] as const;

  const thresholdHelp =
    threshold === "5stars"
      ? "Solo las reseñas de 5 estrellas se publicarán automáticamente."
      : threshold === "4stars"
      ? "Las reseñas de 4 y 5 estrellas se publicarán automáticamente."
      : "Las reseñas de 3, 4 y 5 estrellas se publicarán automáticamente.";

  return (
    <>
      {/* Cabecera compacta de estado */}
      <div className="hidden sm:flex items-center justify-end gap-2 mb-3">
        <span className="text-xs text-muted-foreground">Modo:</span>
        <Badge variant="secondary" className="text-xs">
          {autoPublishEnabled ? "Auto" : "Borrador"}
        </Badge>
      </div>

      {/* Info box */}
      <div className="flex gap-3 p-4 rounded-lg bg-accent/10 border border-accent/20">
        <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">¿Cómo funciona la autopublicación?</p>
          <p className="text-sm text-muted-foreground">
            1) Llega una reseña nueva. 2) Se genera automáticamente un <strong>borrador</strong> de respuesta.
            3) Si activas la autopublicación, se publicarán <strong>directamente</strong> las que cumplan el criterio de estrellas.
            El resto se te notificará (y aparecerá en la app) para que decidas si generar más variantes o publicarlas.
          </p>
        </div>
      </div>

      {/* Toggle autopublicación */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-background/50 mt-6">
        <div className="space-y-0.5">
          <Label htmlFor="autoPublish" className="text-base font-medium cursor-pointer">
            Activar autopublicación
          </Label>
          <p className="text-sm text-muted-foreground">
            Las respuestas se publicarán automáticamente según el criterio configurado
          </p>
        </div>
        <Switch
          id="autoPublish"
          checked={autoPublishEnabled}
          onCheckedChange={(checked) => onUpdate({ publishMode: checked ? "auto" : "draft" })}
        />
      </div>

      {/* Config avanzada cuando está activo */}
      {autoPublishEnabled ? (
        <div className="space-y-6 pl-4 border-l-2 border-primary/20 mt-6">
          {/* Umbral de estrellas */}
          <div className="space-y-3">
            <Label>Autopublicar respuestas a partir de</Label>
            <SegmentedControl
              options={starRangeOptions as any}
              value={threshold}
              onChange={(value) => onUpdate({ autoPublishThreshold: value as Threshold })}
            />
            <p className="text-xs text-muted-foreground">{thresholdHelp}</p>
          </div>

          {/* Separador con título */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Respuestas que NO se autopublican
              </span>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/30">
            <div className="flex items-start gap-3">
              <Bell className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1 space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Notificación de borradores pendientes</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Te avisamos por el canal que elijas cuando una respuesta quede en borrador (además aparecerá en la app).
                    Desde allí podrás revisar, generar más variantes o publicarla.
                  </p>
                </div>

                {/* Canal */}
                <div className="space-y-2">
                  <Label htmlFor="notificationChannel">Canal de notificación</Label>
                  <Select
                    value={settings.notificationChannel}
                    onValueChange={(value) => onUpdate({ notificationChannel: value as NotifyChannel })}
                  >
                    <SelectTrigger id="notificationChannel">
                      <SelectValue placeholder="Selecciona canal" />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.entries(notificationChannels) as Array<
                          [NotifyChannel, (typeof notificationChannels)[NotifyChannel]]
                        >
                      ).map(([key, { icon: Icon, label }]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Contacto */}
                <div className="space-y-2">
                  <Label htmlFor="notificationContact" className="flex items-center gap-2">
                    <NotificationIcon className="h-4 w-4 text-primary" />
                    {channelInfo.label}
                  </Label>
                  <Input
                    id="notificationContact"
                    value={settings.notificationContact}
                    onChange={(e) => onUpdate({ notificationContact: e.target.value })}
                    placeholder={channelInfo.placeholder}
                    type={settings.notificationChannel === "email" ? "email" : "text"}
                  />
                  <p className="text-xs text-muted-foreground">
                    {settings.notificationChannel === "email" && "Dirección de email donde recibirás las notificaciones"}
                    {settings.notificationChannel === "whatsapp" && "Número de WhatsApp con código de país"}
                    {settings.notificationChannel === "sms" && "Número de teléfono con código de país"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Modo borrador */
        <div className="p-4 rounded-lg bg-muted/30 border border-muted mt-6">
          <p className="text-sm text-muted-foreground">
            Con la autopublicación desactivada, todas las respuestas generadas quedarán como <strong>borradores</strong> y
            recibirás una notificación en la app para revisarlas antes de publicar.
          </p>
        </div>
      )}
    </>
  );
}
