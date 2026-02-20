// app/components/admin/integrations/whatsapp/SendTestPanel.tsx
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";

type SendResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string; meta_error?: unknown };

export default function SendTestPanel() {
  const [to, setTo] = useState("34711255362");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);

  async function send() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/integrations/meta/whatsapp/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, body }),
      });

      const json = (await res.json().catch(() => null)) as any;

      if (!res.ok) {
        setResult({
          ok: false,
          error: "Meta rejected the request",
          meta_error: json,
        });
        setLoading(false);
        return;
      }

      setResult({ ok: true, data: json });
      setLoading(false);
    } catch {
      setResult({ ok: false, error: "Request failed" });
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar WhatsApp (test)</CardTitle>
        <CardDescription>
          Envía un mensaje de prueba al número indicado (sandbox por ahora).
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid gap-2">
          <div className="text-sm font-medium">Número destino</div>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="346XXXXXXXX"
          />
          <div className="text-xs text-muted-foreground">
            Formato: prefijo país + número, sin +, sin espacios.
          </div>
        </div>

        <div className="grid gap-2">
          <div className="text-sm font-medium">Body (opcional)</div>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="De momento se ignora; luego lo usaremos para plantillas/texto."
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={send} disabled={loading}>
            {loading ? "Enviando..." : "Enviar test"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setResult(null);
              setBody("");
            }}
            disabled={loading}
          >
            Limpiar
          </Button>
        </div>

        {result && (
          <div className="rounded-lg border p-3 text-sm">
            <div className="font-medium">
              {result.ok ? "OK" : "Error"}
            </div>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}