// app/dashboard/whatsapp/settings/WebhooksCard.tsx
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import { Copy, Link2 } from "lucide-react";

function copyToClipboard(text: string) {
  try {
    void navigator.clipboard.writeText(text);
  } catch {
    // noop
  }
}

export default function WebhooksCard() {
  const callbackPath = "/api/webhooks/whatsapp";

  const [callbackUrl, setCallbackUrl] = useState<string>(callbackPath);

  useEffect(() => {
    setCallbackUrl(`${window.location.origin}${callbackPath}`);
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Webhooks</CardTitle>
            <CardDescription>Panel técnico para verificación y diagnóstico.</CardDescription>
          </div>

          <Badge variant="outline" className="shrink-0">
            Técnico
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        <div className="rounded-xl border p-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-muted-foreground flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Callback URL
            </div>
            <div className="font-mono text-xs mt-1 break-all">{callbackUrl}</div>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="shrink-0"
            onClick={() => copyToClipboard(callbackUrl)}
            title="Copiar"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-xl border p-3">
          <div className="text-muted-foreground">Verify Token</div>
          <div className="font-mono text-xs mt-1">—</div>
        </div>

        <Separator />

        <div className="text-muted-foreground text-xs">
          Aquí luego pondremos: estado real del webhook, último evento recibido, y acciones de diagnóstico.
        </div>
      </CardContent>
    </Card>
  );
}