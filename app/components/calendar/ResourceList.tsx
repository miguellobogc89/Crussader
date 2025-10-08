// app/components/calendar/ResourceList.tsx

"use client";

import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Box } from "lucide-react";

export type Resource = { id: string; name: string; notes?: string | null; capacity?: number | null; active: boolean };

export default function ResourceList({
  items,
  selectedIds,
  statusText,
  onToggle,
}: {
  items: Resource[];
  selectedIds: string[];
  statusText?: string;
  onToggle: (id: string) => void;
}) {
  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Box className="h-5 w-5 text-primary" />
          Recursos
        </CardTitle>
        <div className="text-xs text-muted-foreground">{statusText || ""}</div>
      </CardHeader>
      <CardContent className="max-h-[340px] overflow-auto space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin recursos.</p>
        ) : (
          items.map((r) => {
            const selected = selectedIds.includes(r.id);
            return (
              <button
                key={r.id}
                onClick={() => onToggle(r.id)}
                className={`w-full flex items-center justify-between rounded-md border px-3 py-2 text-left transition ${
                  selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"
                }`}
                title={r.id}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{r.name}</span>
                  {r.capacity ? (
                    <span className="text-[11px] text-muted-foreground">· cap {r.capacity}</span>
                  ) : null}
                </div>
                {selected && <Badge variant="secondary">Sel.</Badge>}
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
