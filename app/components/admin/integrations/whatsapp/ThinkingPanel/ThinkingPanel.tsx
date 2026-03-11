// app/components/admin/integrations/whatsapp/ThinkingPanel/ThinkingPanel.tsx
"use client";

import MemoryPills from "./MemoryPills";

type SystemTurn = {
  id: string;
  text: string;
  at: number;
};

export default function ThinkingPanel({
  memoryValues,
  turns,
  loading,
  canFetch,
}: {
  memoryValues: string[];
  turns: SystemTurn[];
  loading: boolean;
  canFetch: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col p-4">
      <div className="border-b pb-3">
        <div className="text-sm font-semibold">Pensamiento IA</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Mensajes internos (role=SYSTEM). No se envían al cliente.
        </div>
      </div>

      <MemoryPills values={memoryValues} />

      <div className="flex-1 min-h-0 overflow-auto py-3">
        {!canFetch ? (
          <div className="text-xs text-muted-foreground">
            Selecciona una conversación para ver mensajes SYSTEM.
          </div>
        ) : loading && turns.length === 0 ? (
          <div className="text-xs text-muted-foreground">Cargando…</div>
        ) : turns.length === 0 ? (
          <div className="text-xs text-muted-foreground">
            Sin mensajes SYSTEM todavía.
          </div>
        ) : (
          <div className="space-y-2">
            {turns.map((t) => (
              <div key={t.id} className="rounded-xl border bg-background px-3 py-2">
                <div className="text-sm">{t.text}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  {new Date(t.at).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}