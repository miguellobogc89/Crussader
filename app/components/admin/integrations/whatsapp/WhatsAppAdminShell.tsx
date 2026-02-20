// app/components/admin/integrations/whatsapp/WhatsAppAdminShell.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { MessageCircle, SendHorizonal, RefreshCw } from "lucide-react";
import ChatScreen from "@/app/components/admin/integrations/whatsapp/ChatScreen";
import CustomersListPanel from "@/app/components/admin/integrations/whatsapp/CustomersListPanel";

type WaDebugEvent =
  | {
      kind: "status";
      at: number;
      status: string;
      id?: string;
      to?: string;
      ts?: string;
    }
  | {
      kind: "message";
      at: number;
      from: string;
      id?: string;
      type?: string;
      text?: string;
      ts?: string;
    }
  | {
      kind: "out";
      at: number;
      to: string;
      id?: string;
      text?: string;
      ts?: string;
      status?: string;
    };

function normalizePhone(p: string) {
  return p.replace(/[^\d]/g, "");
}

async function fetchDebugEvents(): Promise<{
  ok: boolean;
  count: number;
  events: WaDebugEvent[];
}> {
  const res = await fetch("/api/webhooks/whatsapp?debug=1", { cache: "no-store" });
  if (!res.ok) return { ok: false, count: 0, events: [] };
  const data = (await res.json()) as { ok: boolean; count: number; events: WaDebugEvent[] };
  return data;
}

async function sendTest(to: string, body: string) {
  const res = await fetch("/api/integrations/meta/whatsapp/send-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, body }),
  });

  const data = await res.json().catch(() => null);
  return { ok: res.ok, data };
}

function Toast({
  text,
  onClose,
}: {
  text: string;
  onClose: () => void;
}) {
  return (
    <div className="pointer-events-auto flex items-center justify-between gap-2 rounded-full border bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
      <span className="truncate">{text}</span>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted/60"
      >
        OK
      </button>
    </div>
  );
}

export default function WhatsAppAdminShell({
  initialEvents = [],
}: {
  initialEvents?: WaDebugEvent[];
}) {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("companyId");

  const [events, setEvents] = useState<WaDebugEvent[]>(initialEvents);
  const [loading, setLoading] = useState(false);

  const [selectedPhone, setSelectedPhone] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const data = await fetchDebugEvents();
      if (data.ok) setEvents(data.events);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    const toTrim = normalizePhone(selectedPhone.trim());
    const bodyTrim = body.trim();

    if (!toTrim) {
      setToast("Falta el número destino.");
      return;
    }

    if (!bodyTrim) {
      setToast("Escribe un mensaje antes de enviar.");
      return;
    }

    setSending(true);
    setToast(null);

    try {
      const res = await sendTest(toTrim, bodyTrim);
      if (!res.ok) {
        setToast("Meta rechazó la petición. Mira la consola / respuesta.");
        return;
      }

      setToast("Enviado.");
      setBody("");
      await refresh();
    } finally {
      setSending(false);
    }
  }

  // Poll suave
  useEffect(() => {
    let alive = true;

    async function tick() {
      const data = await fetchDebugEvents();
      if (!alive) return;
      if (data.ok) setEvents(data.events);
    }

    const t = window.setInterval(() => {
      tick();
    }, 2500);

    tick();

    return () => {
      alive = false;
      window.clearInterval(t);
    };
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;

    const t = window.setTimeout(() => {
      setToast(null);
    }, 2200);

    return () => {
      window.clearTimeout(t);
    };
  }, [toast]);

  const visibleEvents = useMemo(() => {
    const p = normalizePhone(selectedPhone.trim());
    if (!p) return events;

    return events.filter((e) => {
      if (e.kind === "message") return normalizePhone(String(e.from || "")) === p;
      if (e.kind === "out") return normalizePhone(String(e.to || "")) === p;
      if (e.kind === "status") return true;
      return false;
    });
  }, [events, selectedPhone]);

  return (
    <div className="h-[calc(100vh-180px)] min-h-[720px]">
      <Card className="h-full overflow-hidden">
        <CardHeader className="border-b py-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-5 w-5" />
              WhatsApp · Admin (DEV)
            </CardTitle>

            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={loading}
              className="shrink-0"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refrescar
            </Button>
          </div>
        </CardHeader>

        <CardContent className="h-[calc(100%-56px)] p-0">
          <div className="grid h-full grid-cols-1 lg:grid-cols-[360px_1fr]">
            {/* Left */}
            <CustomersListPanel
              companyId={companyId}
              selectedPhone={selectedPhone}
              onSelectPhone={(phone) => setSelectedPhone(phone)}
            />

            {/* Right */}
            <div className="flex h-full min-h-0 flex-col">
              <div className="border-b p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="text-sm font-medium">
                    Conversación
                    <span className="ml-2 text-xs text-muted-foreground">
                      {selectedPhone ? selectedPhone : "—"}
                    </span>
                  </div>

                  <div className="flex w-full gap-2 md:w-[520px]">
                    <Input
                      value={selectedPhone}
                      onChange={(e) => setSelectedPhone(e.target.value)}
                      placeholder="Número destino (E.164) ej: 346XXXXXXXX"
                    />
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPhone("")}
                      className="shrink-0"
                    >
                      Limpiar
                    </Button>
                  </div>
                </div>
              </div>

              {/* Chat area + toasts overlay */}
              <div className="relative flex-1 min-h-0">
                <ChatScreen events={visibleEvents} className="h-full" />

                <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center px-4">
                  {toast ? <Toast text={toast} onClose={() => setToast(null)} /> : null}
                </div>
              </div>

              {/* Composer fijo */}
              <div className="border-t bg-background p-3">
                <div className="flex gap-2">
                  <Input
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (!sending) {
                          handleSend();
                        }
                      }
                    }}
                  />
                  <Button onClick={handleSend} disabled={sending} className="shrink-0">
                    <SendHorizonal className="mr-2 h-4 w-4" />
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}