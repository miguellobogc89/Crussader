"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Label } from "@/app/components/ui/label";
import { Shield, Mail, Loader2 } from "lucide-react";

export default function AccountPasswordCard() {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSendLink() {
    try {
      setSending(true);
      setStatus("idle");
      setMessage(null);

      const res = await fetch("/api/account/password/reset-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        setStatus("error");
        setMessage(
          json?.error ||
            "No hemos podido enviar el enlace. Inténtalo de nuevo en unos minutos."
        );
        return;
      }

      setStatus("success");
      setMessage(
        "Te hemos enviado un email con un enlace para cambiar o crear tu contraseña."
      );
    } catch (e: any) {
      setStatus("error");
      setMessage(
        e?.message ||
          "Ha ocurrido un error al enviar el enlace. Inténtalo de nuevo."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Seguridad</span>
          <Badge variant="secondary" className="ml-2">
            Acceso
          </Badge>
        </CardTitle>
        <CardDescription>
          Gestiona cómo accedes a tu cuenta y solicita un enlace seguro para
          cambiar tu contraseña.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bloque contraseña vía email */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 rounded-xl border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label className="font-medium">Cambiar contraseña</Label>
              <Badge variant="outline" className="text-xs">
                Recomendado
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Te enviaremos un email con un enlace seguro para cambiar o crear
              tu contraseña. Funciona tanto si ya tienes una como si accedes por
              Google.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-xl w-full sm:w-auto"
            type="button"
            onClick={handleSendLink}
            disabled={sending}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Enviar enlace
              </>
            )}
          </Button>
        </div>

        {/* Mensaje de estado */}
        {status !== "idle" && message && (
          <p
            className={`text-sm ${
              status === "success"
                ? "text-emerald-600"
                : "text-destructive"
            }`}
          >
            {message}
          </p>
        )}

        {/* Bloque 2FA (placeholder futuro) */}
        <div className="flex items-center justify-between p-4 rounded-xl border">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Label className="font-medium">
                Autenticación de dos factores (2FA)
              </Label>
              <Badge variant="secondary">Próximamente</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Añadiremos una capa extra de seguridad con 2FA en futuras
              versiones.
            </p>
          </div>
          <Button variant="outline" className="rounded-xl" disabled>
            Configurar 2FA
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
